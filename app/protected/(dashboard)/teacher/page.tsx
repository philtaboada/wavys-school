import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import PostGeneral from "@/components/PostGeneral";
import { createClient } from "@/utils/supabase/server";
import { useUserRole } from "@/utils/hooks";


const TeacherPage = async () => {
  const supabase = await createClient();
  const { user } = await useUserRole();
  const userId = user?.id;
  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Publicaciones que te pueden interesar</h1>
          {/* <BigCalendarContainer type="teacherId" id={userId!} /> */}
          <PostGeneral
            author={{
              name: "Joana Velez",
              avatar: "https://media.licdn.com/dms/image/v2/D4E12AQF1j5jzVYYgpQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1695251784474?e=1747267200&v=beta&t=N4PVXUgqYsBlKdonpOS59dMY5nanc0W7nPmn5vT2Js4",
              initials: "JD",
            }}
            timeAgo="Hace 1 hora"
            content="¡✨Vive la tradición en el gran Paseo de Antorchas! 🔥🎉
Este 25 de julio a las 6:00 p.m. 🗓️⏰ en Puente Balta.
¡Premios, sorpresas y diversión en familia! 👨‍👩‍👧‍👦🏆
#UnidosEmpiezaElCambio 💜"
            image="https://cdn.www.gob.pe/uploads/campaign/photo/000/033/374/11.jpg"
            type="general"
            attendees={10}
            comments={10}
            likes={10}
          />
           <PostGeneral
            author={{
              name: "Joana Velez",
              avatar: "https://media.licdn.com/dms/image/v2/D4E12AQF1j5jzVYYgpQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1695251784474?e=1747267200&v=beta&t=N4PVXUgqYsBlKdonpOS59dMY5nanc0W7nPmn5vT2Js4",
              initials: "JD",
            }}
            timeAgo="Hace 1 hora"
            content="¡🎭✨Llega el III Sheati Títere Internacional!
Disfruta de presentaciones mágicas con grupos de Argentina, México, Ecuador y Perú 🇦🇷🇲🇽🇪🇨🇵🇪
📅 25 y 26 de marzo — 🕖 7:00 p.m. — 📍Auditorio del Colegio Andino
¡Y un conversatorio especial para docentes! 👩‍🏫👨‍🏫
#Cultura #Educación #Títeres"
            image="https://blog.continental.edu.pe/centro-cultural/wp-content/uploads/sites/5/2015/03/evento-centro-cultural.jpg"
            type="general"
            attendees={20}
            comments={15}
            likes={35}
          />
           <PostGeneral
            author={{
              name: "Joana Velez",
              avatar: "https://media.licdn.com/dms/image/v2/D4E12AQF1j5jzVYYgpQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1695251784474?e=1747267200&v=beta&t=N4PVXUgqYsBlKdonpOS59dMY5nanc0W7nPmn5vT2Js4",
              initials: "JD",
            }}
            timeAgo="Hace 1 hora"
            content="🧮📚 ¡No te pierdas el Primer Seminario Internacional!
👉 “Abordando los desafíos actuales en la enseñanza de las matemáticas”
🗓 25 de enero — ⏰ 3:00 p.m. — 📲 Vía Zoom y Facebook Live
Con grandes ponentes internacionales 🌎👩‍🏫👨‍🏫
¡Inscríbete gratis y recibe tu certificación! ✅✨
#Educación #Matemáticas #Seminario"
            image="https://www.elumbreras.com.pe/sites/default/files/boton-web-14_1.png"
            type="general"
            attendees={40}
            comments={37}
            likes={45}
          />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <BigCalendarContainer type="teacherId" id={userId!} />
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
