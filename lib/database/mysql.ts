import mysql from 'mysql2/promise';

// MySQL bağlantı konfigürasyonu - Production Ready
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tolgademir',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+00:00',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  maxIdle: 5,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000,
  connectTimeout: 30000,
  // acquireTimeout kaldırıldı - MySQL2'de geçersiz parametre
  // MySQL 8.0+ için
  authPlugins: {
    mysql_clear_password: () => () => Buffer.from(process.env.DB_PASSWORD || '')
  }
};

// MySQL bağlantı havuzu
let pool: mysql.Pool | null = null;

export const getConnection = async (): Promise<mysql.Pool> => {
  if (!pool) {
    try {
      pool = mysql.createPool(dbConfig);
      
      // Bağlantıyı test et - retry ile
      let connected = false;
      let retries = 3;
      
      while (!connected && retries > 0) {
        try {
          const connection = await pool.getConnection();
          await connection.ping(); // Ping ile test et
          console.log('✅ MySQL database connected successfully');
          connection.release();
          connected = true;
        } catch (pingError) {
          retries--;
          console.warn(`⚠️ MySQL ping failed, retrying... (${retries} left)`);
          if (retries === 0) throw pingError;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.error('❌ MySQL connection failed:', error);
      pool = null; // Reset pool on failure
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return pool;
};

// Veritabanı işlemleri için yardımcı fonksiyonlar - Enhanced Error Handling
export const executeQuery = async (query: string, params: any[] = []): Promise<any> => {
  let retries = 5; // Artırıldı: 3 → 5
  let lastError: any = null;
  
  while (retries > 0) {
    try {
      const pool = await getConnection();
      
      // Pool'dan gerçek bir connection al
      const connection = await pool.getConnection();
      
      try {
        // Params'ı güvenli hale getir - mysql2 array bekliyor
        const safeParams = Array.isArray(params) ? params : [];
        
        // Debug logları sadece gerektiğinde
        if (process.env.DEBUG_SQL === 'true') {
          console.log('🔍 Execute DEBUG:', {
            queryType: typeof query,
            queryLength: query?.length,
            paramsType: typeof safeParams,
            paramsIsArray: Array.isArray(safeParams),
            paramsLength: safeParams.length,
            paramsContent: JSON.stringify(safeParams)
          });
        }
        
        // Query'yi temizle (whitespace normalize)
        const cleanQuery = query.trim().replace(/\s+/g, ' ');
        
        // execute() yerine query() kullanıyoruz - mysql2'de daha esnek
        // PromisePoolConnection.execute() içindeki params.length sorunundan kaçınmak için
        if (process.env.DEBUG_SQL === 'true') {
          console.log('⚙️ Switching to query() instead of execute() method');
        }
        const [rows] = await connection.query(cleanQuery, safeParams);
        
        // Başarılı sorgu sonrası connection health check
        if (retries < 5 && process.env.DEBUG_SQL === 'true') {
          console.log(`✅ Query başarılı (${5 - retries} retry sonrası)`);
        }
        
        return rows;
      } finally {
        // Connection'ı mutlaka pool'a geri ver
        connection.release();
      }
    } catch (error: any) {
      lastError = error;
      
      // Sadece kritik hataları logla
      if (retries <= 1 || process.env.DEBUG_SQL === 'true') {
        console.error('❌ Database query error:', {
          code: error.code,
          errno: error.errno,
          sqlMessage: error.sqlMessage,
          sqlState: error.sqlState,
          retriesLeft: retries - 1
        });
      }
      
      // Bağlantı hatası veya deadlock - pool'u sıfırla ve tekrar dene
      const isRetryableError = 
        error.code === 'PROTOCOL_CONNECTION_LOST' || 
        error.code === 'ECONNRESET' ||
        error.code === 'ER_CON_COUNT_ERROR' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ER_LOCK_DEADLOCK' ||
        error.errno === 1213 || // Deadlock
        error.errno === 1205;   // Lock wait timeout
      
      if (isRetryableError) {
        retries--;
        console.log(`⚠️ Retryable error detected, retrying... (${retries} attempts left)`);
        
        // Pool'u sıfırla
        if (pool && (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET')) {
          try {
            await pool.end();
            console.log('🔄 Pool reset due to connection error');
          } catch (e) {
            console.error('Pool end error:', e);
          }
          pool = null;
        }
        
        if (retries > 0) {
          const delay = (5 - retries + 1) * 1000; // Progressive backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Non-retryable error (syntax error, constraint violation, etc.)
        console.error('❌ Non-retryable error:', error.sqlMessage || error.message);
        throw error;
      }
    }
  }
  
  console.error('❌ Query failed after all retries');
  throw lastError || new Error('Database query failed after retries');
};

export const executeTransaction = async (queries: Array<{ query: string; params: any[] }>): Promise<any[]> => {
  const connection = await getConnection();
  const conn = await connection.getConnection();
  
  try {
    await conn.beginTransaction();
    const results = [];
    
    for (const { query, params } of queries) {
      // Transaction'da da query() kullanıyoruz - tutarlılık için
      const [result] = await conn.query(query, params);
      results.push(result);
    }
    
    await conn.commit();
    return results;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Bağlantıyı kapat
export const closeConnection = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('MySQL connection closed');
  }
};

export default getConnection;
