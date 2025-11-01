'use client';

import { useState } from 'react';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  platforms?: Array<'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'telegram'>;
  className?: string;
}

export default function SocialShare({
  url,
  title,
  description = '',
  image = '',
  platforms = ['facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram'],
  className = ''
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  };

  const platformIcons = {
    facebook: 'ri-facebook-fill',
    twitter: 'ri-twitter-fill',
    linkedin: 'ri-linkedin-fill',
    whatsapp: 'ri-whatsapp-fill',
    telegram: 'ri-telegram-fill'
  };

  const platformColors = {
    facebook: 'bg-blue-600 hover:bg-blue-700',
    twitter: 'bg-sky-500 hover:bg-sky-600',
    linkedin: 'bg-blue-700 hover:bg-blue-800',
    whatsapp: 'bg-green-500 hover:bg-green-600',
    telegram: 'bg-blue-500 hover:bg-blue-600'
  };

  const handleShare = (platform: string) => {
    const shareUrl = shareUrls[platform as keyof typeof shareUrls];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Paylaş:
      </span>
      
      <div className="flex items-center space-x-2">
        {platforms.map((platform) => (
          <button
            key={platform}
            onClick={() => handleShare(platform)}
            className={`w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors ${platformColors[platform]}`}
            title={`${platform.charAt(0).toUpperCase() + platform.slice(1)}'da paylaş`}
          >
            <i className={`${platformIcons[platform]} text-sm`}></i>
          </button>
        ))}
        
        <button
          onClick={handleCopyLink}
          className="w-8 h-8 rounded-full bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center transition-colors"
          title="Linki kopyala"
        >
          <i className={`ri-${copied ? 'check' : 'links'}-line text-sm`}></i>
        </button>
      </div>
    </div>
  );
}

// Social media follow buttons
interface SocialFollowProps {
  className?: string;
}

export function SocialFollow({ className = '' }: SocialFollowProps) {
  const socialLinks = [
    {
      platform: 'Facebook',
      url: '',
      icon: 'ri-facebook-fill',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      platform: 'Twitter',
      url: '',
      icon: 'ri-twitter-fill',
      color: 'bg-sky-500 hover:bg-sky-600'
    },
    {
      platform: 'Instagram',
      url: 'https://www.instagram.com/tolgademir1914',
      icon: 'ri-instagram-fill',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
    },
    {
      platform: 'LinkedIn',
      url: '',
      icon: 'ri-linkedin-fill',
      color: 'bg-blue-700 hover:bg-blue-800'
    },
    {
      platform: 'YouTube',
      url: '',
      icon: 'ri-youtube-fill',
      color: 'bg-red-600 hover:bg-red-700'
    }
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Takip et:
      </span>
      
      <div className="flex items-center space-x-2">
        {socialLinks.map((social) => (
          <a
            key={social.platform}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors ${social.color}`}
            title={`${social.platform}'da takip et`}
          >
            <i className={`${social.icon} text-sm`}></i>
          </a>
        ))}
      </div>
    </div>
  );
}

// Social media post preview
interface SocialPostPreviewProps {
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram';
  content: string;
  image?: string;
  className?: string;
}

export function SocialPostPreview({
  platform,
  content,
  image,
  className = ''
}: SocialPostPreviewProps) {
  const getPlatformStyles = () => {
    switch (platform) {
      case 'facebook':
        return 'bg-white border border-gray-200 rounded-lg p-4 max-w-md';
      case 'twitter':
        return 'bg-white border border-gray-200 rounded-lg p-4 max-w-sm';
      case 'linkedin':
        return 'bg-white border border-gray-200 rounded-lg p-4 max-w-md';
      case 'instagram':
        return 'bg-white border border-gray-200 rounded-lg p-4 max-w-sm';
      default:
        return 'bg-white border border-gray-200 rounded-lg p-4 max-w-md';
    }
  };

  const getCharacterLimit = () => {
    switch (platform) {
      case 'twitter':
        return 280;
      case 'facebook':
      case 'linkedin':
        return 3000;
      case 'instagram':
        return 2200;
      default:
        return 1000;
    }
  };

  const limit = getCharacterLimit();
  const remaining = limit - content.length;
  const isOverLimit = remaining < 0;

  return (
    <div className={`${getPlatformStyles()} ${className}`}>
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
        <div>
          <div className="font-semibold text-sm">Tolga Demir</div>
          <div className="text-xs text-gray-500">@{platform}</div>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
      
      {image && (
        <div className="mb-3">
          <img
            src={image}
            alt="Post image"
            className="w-full h-48 object-cover rounded"
          />
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
        <span className={isOverLimit ? 'text-red-500' : 'text-gray-500'}>
          {remaining} karakter kaldı
        </span>
      </div>
    </div>
  );
}
