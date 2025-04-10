import React from 'react';
import Image from 'next/image';

interface PostGeneralProps {
  author: {
    name: string;
    avatar?: string;
    initials: string;
  };
  timeAgo: string;
  content: string;
  image?: string;
  type?: 'comunicado' | 'anuncio' | 'general';
  attendees?: number;
  comments?: number;
  likes?: number;
}

const PostGeneral: React.FC<PostGeneralProps> = ({
  author,
  timeAgo,
  content,
  image,
  type = 'general',
  attendees,
  comments = 0,
  likes = 0,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
      {/* Encabezado del post */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-medium">{author.initials}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">{author.name}</h3>
              <span className="text-xs text-gray-500">ha publicado un evento</span>
              {type === 'comunicado' && (
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded">
                  Comunicado
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">hace {timeAgo}</p>
          </div>
        </div>
        <button className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500">···</span>
        </button>
      </div>

      {/* Contenido del post */}
      <div className="px-4 pb-3">
        {type === 'comunicado' && (
          <h2 className="font-bold text-base uppercase mb-2">{content}</h2>
        )}
        {type !== 'comunicado' && <p className="text-gray-700 mb-2">{content}</p>}
      </div>

      {/* Imagen del post (si existe) */}
      {image && (
        <div className="w-full flex justify-center py-2">
          <div className="relative max-w-full max-h-[500px] overflow-hidden">
            <Image
              src={image}
              alt="Contenido de la publicación"
              width={800}
              height={600}
              className="max-h-[500px] w-auto h-auto object-contain"
              style={{ margin: '0 auto' }}
            />
          </div>
        </div>
      )}

      {/* Estadísticas e interacciones */}
      <div className="px-4 py-2 flex justify-between items-center border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs">👍</span>
            </div>
          </div>
          <span className="text-xs text-gray-500">{likes}</span>
        </div>
        {attendees && (
          <div className="text-xs text-gray-500">{attendees} espectadores</div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-3 border-t border-gray-100">
        <button className="py-2 flex items-center justify-center gap-2 hover:bg-gray-100 rounded-none">
          <span className="text-gray-600">👍</span>
          <span className="text-sm">Me gusta</span>
        </button>
        <button className="py-2 flex items-center justify-center gap-2 hover:bg-gray-100 rounded-none">
          <span className="text-gray-600">💬</span>
          <span className="text-sm">Comentar</span>
        </button>
        <button className="py-2 flex items-center justify-center gap-2 hover:bg-gray-100 rounded-none">
          <span className="text-gray-600">↪️</span>
          <span className="text-sm">Compartir</span>
        </button>
      </div>
    </div>
  );
};

export default PostGeneral;
