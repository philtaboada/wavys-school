"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  AnnouncementSchema,
  ParentSchema,
  AttendanceSchema
} from "./formValidationSchemas";
import { createClient } from "@/utils/supabase/server";

type CurrentState = { success: boolean; error: boolean; message?: string };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    const supabase = await createClient();
    
    // Crear el subject
    const { data: subjectData, error: subjectError } = await supabase
      .from('subject')
      .insert({
        name: data.name
      })
      .select()
      .single();

    if (subjectError) throw subjectError;
    
    // Relacionar con profesores
    if (data.teachers && data.teachers.length > 0) {
      const teacherConnections = data.teachers.map((teacherId: any) => ({
        teacherId,
        subjectId: subjectData.id
      }));
      
      const { error: relationError } = await supabase
        .from('teacher_subject')
        .insert(teacherConnections);
      
      if (relationError) throw relationError;
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    const supabase = await createClient();
    
    // Actualizar el subject
    const { error: subjectError } = await supabase
      .from('subject')
      .update({ name: data.name })
      .eq('id', data.id);

    if (subjectError) throw subjectError;
    
    // Eliminar relaciones existentes
    const { error: deleteError } = await supabase
      .from('teacher_subject')
      .delete()
      .eq('subjectId', data.id);
      
    if (deleteError) throw deleteError;
    
    // Crear nuevas relaciones
    if (data.teachers && data.teachers.length > 0) {
      const teacherConnections = data.teachers.map((teacherId: any) => ({
        teacherId,
        subjectId: data.id
      }));
      
      const { error: relationError } = await supabase
        .from('teacher_subject')
        .insert(teacherConnections);
      
      if (relationError) throw relationError;
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const supabase = await createClient();
    
    // Eliminar relaciones primero
    const { error: relationError } = await supabase
      .from('teacher_subject')
      .delete()
      .eq('subjectId', id);
      
    if (relationError) throw relationError;
    
    // Eliminar el subject
    const { error } = await supabase
      .from('subject')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('class')
      .insert(data);

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('class')
      .update(data)
      .eq('id', data.id);

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('class')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const supabase = await createClient();
    
    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email || `${data.username}@example.com`,
      password: data.password || "",
      options: {
        data: {
          role: "teacher",
          name: data.name,
          surname: data.surname
        }
      }
    });

    if (authError) throw authError;
    
    // Crear registro en la tabla de teachers
    const { error: teacherError } = await supabase
      .from('teacher')
      .insert({
        id: authData.user?.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        imgPath: data.imgPath || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday
      });

    if (teacherError) throw teacherError;
    
    // Relacionar con asignaturas
    if (data.subjects && data.subjects.length > 0) {
      const subjectConnections = data.subjects.map((subjectId: any) => ({
        teacherId: authData.user?.id,
        subjectId
      }));
      
      const { error: relationError } = await supabase
        .from('teacher_subject')
        .insert(subjectConnections);
      
      if (relationError) throw relationError;
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const supabase = await createClient();
    
    // Actualizar usuario en Supabase Auth si hay nueva contraseña
    if (data.password) {
      const { error: authError } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (authError) throw authError;
    }
    
    // Actualizar registro en la tabla de teachers
    const { error: teacherError } = await supabase
      .from('teacher')
      .update({
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        imgPath: data.imgPath || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday
      })
      .eq('id', data.id);

    if (teacherError) throw teacherError;
    
    // Eliminar relaciones existentes
    const { error: deleteError } = await supabase
      .from('teacher_subject')
      .delete()
      .eq('teacherId', data.id);
      
    if (deleteError) throw deleteError;
    
    // Crear nuevas relaciones
    if (data.subjects && data.subjects.length > 0) {
      const subjectConnections = data.subjects.map((subjectId: any) => ({
        teacherId: data.id,
        subjectId
      }));
      
      const { error: relationError } = await supabase
        .from('teacher_subject')
        .insert(subjectConnections);
      
      if (relationError) throw relationError;
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const supabase = await createClient();
    
    // Eliminar relaciones primero
    const { error: relationError } = await supabase
      .from('teacher_subject')
      .delete()
      .eq('teacherId', id);
      
    if (relationError) throw relationError;
    
    // Eliminar el registro de teacher
    const { error: teacherError } = await supabase
      .from('teacher')
      .delete()
      .eq('id', id);

    if (teacherError) throw teacherError;
    
    // Eliminar el usuario de Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    
    if (authError) throw authError;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  try {
    const supabase = await createClient();
    
    // Verificar capacidad de la clase
    const { data: classData, error: classError } = await supabase
      .from('class')
      .select('id, capacity')
      .eq('id', data.classId)
      .single();
      
    if (classError) throw classError;
    
    const { count: studentCount, error: countError } = await supabase
      .from('student')
      .select('id', { count: 'exact', head: true })
      .eq('classId', data.classId);
      
    if (countError) throw countError;
    
    if (classData.capacity === studentCount) {
      return { success: false, error: true, message: "La clase ha alcanzado su capacidad máxima." };
    }
    
    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email || `${data.username}@example.com`,
      password: data.password || "",
      options: {
        data: {
          role: "student",
          name: data.name,
          surname: data.surname
        }
      }
    });

    if (authError) throw authError;
    
    // Crear registro en la tabla de students
    const { error: studentError } = await supabase
      .from('student')
      .insert({
        id: authData.user?.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        imgPath: data.imgPath || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId
      });

    if (studentError) throw studentError;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const supabase = await createClient();
    
    // Actualizar usuario en Supabase Auth si hay nueva contraseña
    if (data.password) {
      const { error: authError } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (authError) throw authError;
    }
    
    // Actualizar registro en la tabla de students
    const { error: studentError } = await supabase
      .from('student')
      .update({
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        imgPath: data.imgPath || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId
      })
      .eq('id', data.id);

    if (studentError) throw studentError;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const supabase = await createClient();
    
    // Eliminar el registro de student
    const { error: studentError } = await supabase
      .from('student')
      .delete()
      .eq('id', id);

    if (studentError) throw studentError;
    
    // Eliminar el usuario de Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    
    if (authError) throw authError;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    const supabase = await createClient();
    
    // Opcional: Verificar si el usuario es profesor de la lección
    // const { data: { user } } = await supabase.auth.getUser();
    // if (user?.user_metadata.role === "teacher") {
    //   const { data: lesson, error: lessonError } = await supabase
    //     .from('lesson')
    //     .select('id')
    //     .eq('id', data.lessonId)
    //     .eq('teacherId', user.id)
    //     .single();
    //     
    //   if (lessonError || !lesson) {
    //     return { success: false, error: true, message: "No tienes permisos para esta lección" };
    //   }
    // }
    
    const { error } = await supabase
      .from('exam')
      .insert({
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId
      });

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    const supabase = await createClient();
    
    // Opcional: Verificar si el usuario es profesor de la lección
    // const { data: { user } } = await supabase.auth.getUser();
    // if (user?.user_metadata.role === "teacher") {
    //   const { data: lesson, error: lessonError } = await supabase
    //     .from('lesson')
    //     .select('id')
    //     .eq('id', data.lessonId)
    //     .eq('teacherId', user.id)
    //     .single();
    //     
    //   if (lessonError || !lesson) {
    //     return { success: false, error: true, message: "No tienes permisos para esta lección" };
    //   }
    // }
    
    const { error } = await supabase
      .from('exam')
      .update({
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId
      })
      .eq('id', data.id);

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  
  try {
    const supabase = await createClient();
    
    // Opcional: Verificar si el usuario es profesor de la lección
    // const { data: { user } } = await supabase.auth.getUser();
    // if (user?.user_metadata.role === "teacher") {
    //   const { data: exam, error: examError } = await supabase
    //     .from('exam')
    //     .select('lesson:lessonId(teacherId)')
    //     .eq('id', id)
    //     .single();
    //     
    //   if (examError || !exam || exam.lesson.teacherId !== user.id) {
    //     return { success: false, error: true, message: "No tienes permisos para eliminar este examen" };
    //   }
    // }
    
    const { error } = await supabase
      .from('exam')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('announcement')
      .insert({
        title: data.title,
        description: data.description,
        date: data.date,
        classId: data.classId || null
      });

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('announcement')
      .update({
        title: data.title,
        description: data.description,
        date: data.date,
        classId: data.classId || null
      })
      .eq('id', data.id);

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('announcement')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  try {
    const supabase = await createClient();
    
    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email || `${data.username}@example.com`,
      password: data.password || "",
      options: {
        data: {
          role: "parent",
          name: data.name,
          surname: data.surname
        }
      }
    });

    if (authError) throw authError;
    
    // Crear registro en la tabla de parents
    const { error: parentError } = await supabase
      .from('parent')
      .insert({
        id: authData.user?.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address
      });

    if (parentError) throw parentError;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const supabase = await createClient();
    
    // Actualizar usuario en Supabase Auth si hay nueva contraseña
    if (data.password) {
      const { error: authError } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (authError) throw authError;
    }
    
    // Actualizar registro en la tabla de parents
    const { error: parentError } = await supabase
      .from('parent')
      .update({
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address
      })
      .eq('id', data.id);

    if (parentError) throw parentError;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const supabase = await createClient();
    
    // Verificar si hay estudiantes relacionados
    const { count, error: countError } = await supabase
      .from('student')
      .select('id', { count: 'exact', head: true })
      .eq('parentId', id);
      
    if (countError) throw countError;
    
    if (count && count > 0) {
      return { 
        success: false, 
        error: true, 
        message: "No se puede eliminar este padre porque tiene estudiantes asociados."
      };
    }
    
    // Eliminar el registro de parent
    const { error: parentError } = await supabase
      .from('parent')
      .delete()
      .eq('id', id);

    if (parentError) throw parentError;
    
    // Eliminar el usuario de Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    
    if (authError) throw authError;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Acciones para la gestión de asistencia
export const createAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  try {
    const supabase = await createClient();
    
    // Verificar si la asistencia ya existe para evitar duplicados
    const { data: existingAttendance, error: checkError } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', data.student_id)
      .eq('lesson_id', data.lesson_id)
      .eq('date', new Date(data.date).toISOString().split('T')[0])
      .single();
    
    if (!checkError && existingAttendance) {
      // Actualizar la asistencia existente
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          present: data.present,
          date: data.date
        })
        .eq('id', existingAttendance.id);
      
      if (updateError) throw updateError;
    } else {
      // Crear nueva asistencia
      const { error } = await supabase
        .from('attendance')
        .insert({
          date: data.date,
          present: data.present,
          student_id: data.student_id,
          lesson_id: data.lesson_id
        });
  
      if (error) throw error;
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('attendance')
      .update({
        date: data.date,
        present: data.present,
        student_id: data.student_id,
        lesson_id: data.lesson_id
      })
      .eq('id', data.id);

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAttendance = async (
  currentState: CurrentState,
  id: number
) => {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
