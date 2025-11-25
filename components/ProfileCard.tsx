import React from 'react';
import { InstagramProfile } from '../types';
import { DEFAULT_WHATSAPP_NUMBER } from '../constants';
import { Instagram, Phone, Users, ExternalLink } from 'lucide-react';

interface ProfileCardProps {
  profile: InstagramProfile;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  // Logic to handle WhatsApp link fallback
  // If profile.whatsapp is null, we assume the AI didn't find a direct number in the bio.
  // We maintain the fallback to a default number as per original requirements, 
  // but the AI is now optimized to find the REAL number whenever possible.
  const hasRealWhatsapp = !!profile.whatsapp;
  const whatsappLink = profile.whatsapp 
    ? profile.whatsapp 
    : `https://wa.me/${DEFAULT_WHATSAPP_NUMBER}?text=Olá, vim pelo Acelera Leads!`;

  // Fallback for profile picture using UI Avatars if none provided by AI
  const displayImage = profile.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1e293b&color=cbd5e1&size=150`;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-black/50 transition-all duration-300 border border-slate-800 flex flex-col h-full group/card overflow-hidden">
      
      {/* Decorative Header / Cover */}
      <div className="h-24 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-purple-500/10 group-hover/card:opacity-30 transition-opacity duration-500"></div>
      </div>
      
      {/* Main Content Container */}
      <div className="px-6 flex flex-col flex-grow relative">
        
        {/* Top Row: Avatar & Followers */}
        <div className="flex justify-between items-end -mt-12 mb-4">
          <div className="relative">
             <img 
              src={displayImage} 
              alt={profile.name} 
              className="w-24 h-24 rounded-full border-[5px] border-slate-900 shadow-md object-cover bg-slate-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1e293b&color=cbd5e1`;
              }}
            />
            <div className="absolute bottom-1 right-1 bg-slate-900 rounded-full p-1.5 shadow-sm border border-slate-800">
               <Instagram className="w-3.5 h-3.5 text-pink-500" />
            </div>
          </div>

          {/* Followers Badge - Dark Look */}
          {profile.followers && (
            <div className="mb-1 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm rounded-full text-xs font-semibold text-slate-200 border border-slate-700 shadow-sm">
              <Users className="w-3.5 h-3.5 text-brand-400" />
              <span>{profile.followers}</span>
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex-grow">
          <div className="mb-3">
            <h3 className="text-xl font-bold text-slate-100 leading-tight tracking-tight">{profile.name}</h3>
            <a 
              href={profile.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-brand-400 font-medium hover:text-brand-300 transition-colors mt-0.5"
            >
              @{profile.username}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </div>
          
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-4 font-normal border-t border-slate-800 pt-3">
            {profile.bio || "Biografia não disponível."}
          </p>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="p-5 mt-6 grid grid-cols-2 gap-3 bg-slate-950/30 border-t border-slate-800">
        <a 
          href={profile.instagram_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl hover:bg-slate-700 hover:border-slate-600 hover:text-white transition-all text-sm font-semibold group/btn"
        >
          <Instagram className="w-4 h-4 text-slate-400 group-hover/btn:text-pink-400 transition-colors" />
          Instagram
        </a>
        
        <a 
          href={whatsappLink} 
          target="_blank" 
          rel="noopener noreferrer"
          title={hasRealWhatsapp ? "Número encontrado na bio" : "Link padrão"}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold border border-transparent
            ${hasRealWhatsapp 
              ? 'bg-green-600 text-white hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/20' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200' 
            }`}
        >
          <Phone className={`w-4 h-4 ${hasRealWhatsapp ? 'fill-white/20' : ''}`} />
          {hasRealWhatsapp ? 'WhatsApp' : 'WhatsApp'}
        </a>
      </div>
    </div>
  );
};

export default ProfileCard;