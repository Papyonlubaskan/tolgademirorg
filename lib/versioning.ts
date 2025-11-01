interface ContentVersion {
  id: string;
  contentId: string;
  contentType: 'book' | 'chapter' | 'page' | 'post';
  version: number;
  title: string;
  content: string;
  summary: string;
  changes: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
  isPublished: boolean;
  isCurrent: boolean;
  metadata: {
    wordCount: number;
    characterCount: number;
    readingTime: number;
    tags: string[];
    category?: string;
  };
}

interface VersionComparison {
  current: ContentVersion;
  previous: ContentVersion;
  changes: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  diff: {
    title: boolean;
    content: boolean;
    summary: boolean;
  };
}

class ContentVersioning {
  private versions: Map<string, ContentVersion[]> = new Map();
  private maxVersionsPerContent: number = 50;

  // Create a new version
  createVersion(
    contentId: string,
    contentType: 'book' | 'chapter' | 'page' | 'post',
    title: string,
    content: string,
    summary: string,
    authorId: string,
    authorName: string,
    changes: string[] = []
  ): ContentVersion {
    const existingVersions = this.versions.get(contentId) || [];
    const nextVersion = existingVersions.length + 1;

    // Mark all existing versions as not current
    existingVersions.forEach(version => {
      version.isCurrent = false;
    });

    const newVersion: ContentVersion = {
      id: `${contentId}-v${nextVersion}`,
      contentId,
      contentType,
      version: nextVersion,
      title,
      content,
      summary,
      changes,
      authorId,
      authorName,
      createdAt: new Date().toISOString(),
      isPublished: false,
      isCurrent: true,
      metadata: this.calculateMetadata(content)
    };

    existingVersions.push(newVersion);
    this.versions.set(contentId, existingVersions);

    // Cleanup old versions
    this.cleanupOldVersions(contentId);

    return newVersion;
  }

  // Get all versions for content
  getVersions(contentId: string): ContentVersion[] {
    return this.versions.get(contentId) || [];
  }

  // Get specific version
  getVersion(contentId: string, version: number): ContentVersion | null {
    const versions = this.versions.get(contentId) || [];
    return versions.find(v => v.version === version) || null;
  }

  // Get current version
  getCurrentVersion(contentId: string): ContentVersion | null {
    const versions = this.versions.get(contentId) || [];
    return versions.find(v => v.isCurrent) || null;
  }

  // Restore to specific version
  restoreVersion(contentId: string, version: number): ContentVersion | null {
    const versions = this.versions.get(contentId) || [];
    const targetVersion = versions.find(v => v.version === version);
    
    if (!targetVersion) return null;

    // Mark all versions as not current
    versions.forEach(v => v.isCurrent = false);
    
    // Mark target version as current
    targetVersion.isCurrent = true;
    targetVersion.isPublished = true;

    return targetVersion;
  }

  // Compare two versions
  compareVersions(contentId: string, version1: number, version2: number): VersionComparison | null {
    const versions = this.versions.get(contentId) || [];
    const v1 = versions.find(v => v.version === version1);
    const v2 = versions.find(v => v.version === version2);
    
    if (!v1 || !v2) return null;

    const current = v1.version > v2.version ? v1 : v2;
    const previous = v1.version > v2.version ? v2 : v1;

    return {
      current,
      previous,
      changes: this.calculateChanges(previous, current),
      diff: {
        title: previous.title !== current.title,
        content: previous.content !== current.content,
        summary: previous.summary !== current.summary
      }
    };
  }

  // Get version history
  getVersionHistory(contentId: string): ContentVersion[] {
    const versions = this.versions.get(contentId) || [];
    return versions.sort((a, b) => b.version - a.version);
  }

  // Delete specific version
  deleteVersion(contentId: string, version: number): boolean {
    const versions = this.versions.get(contentId) || [];
    const index = versions.findIndex(v => v.version === version);
    
    if (index === -1) return false;

    const deletedVersion = versions[index];
    
    // Don't allow deleting current version
    if (deletedVersion.isCurrent) return false;

    versions.splice(index, 1);
    this.versions.set(contentId, versions);
    
    return true;
  }

  // Publish version
  publishVersion(contentId: string, version: number): boolean {
    const versions = this.versions.get(contentId) || [];
    const targetVersion = versions.find(v => v.version === version);
    
    if (!targetVersion) return false;

    // Mark all versions as not published
    versions.forEach(v => v.isPublished = false);
    
    // Mark target version as published and current
    targetVersion.isPublished = true;
    targetVersion.isCurrent = true;

    return true;
  }

  // Get published version
  getPublishedVersion(contentId: string): ContentVersion | null {
    const versions = this.versions.get(contentId) || [];
    return versions.find(v => v.isPublished) || null;
  }

  // Calculate content metadata
  private calculateMetadata(content: string): ContentVersion['metadata'] {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const characters = content.length;
    const readingTime = Math.ceil(words.length / 200); // 200 words per minute

    return {
      wordCount: words.length,
      characterCount: characters,
      readingTime,
      tags: this.extractTags(content)
    };
  }

  // Extract tags from content
  private extractTags(content: string): string[] {
    // Simple tag extraction - in real implementation, use NLP
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      if (word.length > 3 && !commonWords.has(word)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  // Calculate changes between versions
  private calculateChanges(previous: ContentVersion, current: ContentVersion): {
    added: string[];
    removed: string[];
    modified: string[];
  } {
    const changes = {
      added: [] as string[],
      removed: [] as string[],
      modified: [] as string[]
    };

    // Compare titles
    if (previous.title !== current.title) {
      changes.modified.push('Başlık değiştirildi');
    }

    // Compare content
    if (previous.content !== current.content) {
      changes.modified.push('İçerik güncellendi');
    }

    // Compare summaries
    if (previous.summary !== current.summary) {
      changes.modified.push('Özet güncellendi');
    }

    // Add custom changes
    changes.added.push(...current.changes);

    return changes;
  }

  // Cleanup old versions
  private cleanupOldVersions(contentId: string): void {
    const versions = this.versions.get(contentId) || [];
    
    if (versions.length > this.maxVersionsPerContent) {
      // Keep current version and most recent versions
      const sortedVersions = versions.sort((a, b) => b.version - a.version);
      const versionsToKeep = sortedVersions.slice(0, this.maxVersionsPerContent);
      
      this.versions.set(contentId, versionsToKeep);
    }
  }

  // Get version statistics
  getVersionStats(contentId: string): {
    totalVersions: number;
    publishedVersions: number;
    currentVersion: number;
    lastModified: string;
    totalChanges: number;
  } {
    const versions = this.versions.get(contentId) || [];
    const publishedVersions = versions.filter(v => v.isPublished);
    const currentVersion = versions.find(v => v.isCurrent);
    const totalChanges = versions.reduce((sum, v) => sum + v.changes.length, 0);

    return {
      totalVersions: versions.length,
      publishedVersions: publishedVersions.length,
      currentVersion: currentVersion?.version || 0,
      lastModified: versions[0]?.createdAt || '',
      totalChanges
    };
  }

  // Search versions
  searchVersions(query: string, contentType?: string): ContentVersion[] {
    const allVersions: ContentVersion[] = [];
    
    for (const versions of this.versions.values()) {
      allVersions.push(...versions);
    }

    return allVersions.filter(version => {
      const matchesQuery = version.title.toLowerCase().includes(query.toLowerCase()) ||
                          version.content.toLowerCase().includes(query.toLowerCase()) ||
                          version.summary.toLowerCase().includes(query.toLowerCase());
      
      const matchesType = !contentType || version.contentType === contentType;
      
      return matchesQuery && matchesType;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Export version data
  exportVersionData(contentId: string): string {
    const versions = this.versions.get(contentId) || [];
    return JSON.stringify(versions, null, 2);
  }

  // Import version data
  importVersionData(contentId: string, data: string): boolean {
    try {
      const versions: ContentVersion[] = JSON.parse(data);
      this.versions.set(contentId, versions);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Global versioning instance
const contentVersioning = new ContentVersioning();

// Export versioning instance and utilities
export { contentVersioning };
export type { ContentVersion, VersionComparison };
export default contentVersioning;
