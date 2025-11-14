// CourseProgressTable.jsx
import React, { useState } from "react";
import s from './styles.module.css';

// Функция для декодирования строк вида \uXXXX
const decodeUnicode = (str) => {
  return str.replace(/\\u([\dA-F]{4})/gi, (match, grp) =>
    String.fromCharCode(parseInt(grp, 16))
  );
};

export default function CourseProgressTable({ data, selectedCourse, courseOptions, coursesData }) {
  const [popupData, setPopupData] = useState(null);

  // Собираем данные об уроках
  const lessonStats = data.reduce((acc, user) => {
    if (!user.courses) return acc;

    // Если selectedCourse пустое, показываем все уроки без фильтрации
    if (!selectedCourse) {
      Object.entries(user.courses).forEach(([courseName, lessons]) => {
        lessons.forEach(lessonName => {
          const decodedLessonName = decodeUnicode(lessonName);
          if (!acc[decodedLessonName]) {
            acc[decodedLessonName] = { count: 0, users: [] };
          }
          acc[decodedLessonName].count += 1;
          acc[decodedLessonName].users.push(user.user_id);
        });
      });
      return acc;
    }

    // Находим название курса по ID из courseOptions
    const selectedCourseOption = courseOptions.find(option => option.key === selectedCourse);
    const selectedCourseName = selectedCourseOption ? selectedCourseOption.text.split(' ').slice(1).join(' ') : '';

    // Проходим по всем ключам в courses
    for (const [courseName, lessons] of Object.entries(user.courses)) {
      // Сравниваем закодированное название курса с выбранным названием
      if (courseName === selectedCourseName) {
        lessons.forEach(lessonName => {
          const decodedLessonName = decodeUnicode(lessonName);
          if (!acc[decodedLessonName]) {
            acc[decodedLessonName] = { count: 0, users: [] };
          }
          acc[decodedLessonName].count += 1;
          acc[decodedLessonName].users.push(user.user_id);
        });
        break; // Прерываем цикл, так как нашли нужный курс
      }
    }
    return acc;
  }, {});

  // Формируем плоский массив уроков и сортируем по sort_order
  const groupedLessons = Object.entries(lessonStats)
    .map(([lessonName, details]) => ({
      lessonName,
      count: details.count,
      users: details.users
    }))
    .sort((a, b) => {
      if (!coursesData || !selectedCourse) return 0; // Если нет данных или курса, не сортируем

      // Находим sort_order для уроков
      const course = coursesData[selectedCourse];
      if (!course || !course.quizzes) return 0;

      const lessonA = course.quizzes.find(quiz => decodeUnicode(quiz.name) === a.lessonName);
      const lessonB = course.quizzes.find(quiz => decodeUnicode(quiz.name) === b.lessonName);

      const sortOrderA = lessonA ? lessonA.sort_order : Infinity;
      const sortOrderB = lessonB ? lessonB.sort_order : Infinity;

      return sortOrderA - sortOrderB;
    });

  const handleCellClick = (lessonName) => {
    const lesson = groupedLessons.find(l => l.lessonName === lessonName);
    if (!lesson || lesson.count === 0) return;

    const usersData = lesson.users.map(userId => {
      // Находим пользователя в data по user_id
      const userData = data.find(user => user.user_id === userId) || {};
      return {
        id: userId,
        url: `https://pokerhub.pro/profile/${userId}`,
        nickname: userData.ph_nickname || "Ник не указан",
        tg_username: userData.tg_username || "Ник не указан",
        lk_username: userData.ph_username || "Ник не указан",
        th_nickname: userData.tg_nickname || "Ник не указан",
      };
    });
    setPopupData({ title: `Прошедшие урок "${lessonName}"`, users: usersData });
  };

  const closePopup = () => setPopupData(null);

  // Индекс строки для чередования цветов
  let rowIndex = 0;

  return (
    <div className={s.tableWrapper}>
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 50px)' }}>
        <table className={s.table} cellPadding="10" cellSpacing="0">
          <thead>
            <tr>
              <th style={{ padding: "20px 10px", backgroundColor: "#4d4d59", color: "#fff", position: "sticky", top: 0, zIndex: 2 }}>
                Урок
              </th>
              <th style={{ padding: "20px 10px", backgroundColor: "#4d4d59", color: "#fff", position: "sticky", top: 0, zIndex: 2 }}>
                Пройден (кол-во пользователей)
              </th>
            </tr>
          </thead>
          <tbody>
            {groupedLessons.map((lesson, index) => {
              const currentRowIndex = rowIndex++; // Увеличиваем индекс для каждой строки

              return (
                <tr
                  key={lesson.lessonName}
                  style={{ backgroundColor: currentRowIndex % 2 === 0 ? "#3a3a44" : "#4d4d59" }}
                >
                  <td
                    style={{
                      padding: "2px 10px",
                      color: "#fff",
                      backgroundColor: currentRowIndex % 2 === 0 ? "#3a3a44" : "#4d4d59"
                    }}
                  >
                    {lesson.lessonName}
                  </td>
                  <td
                    style={{
                      padding: "2px 10px",
                      color: "#fff",
                      cursor: lesson.count > 0 ? "pointer" : "default",
                      textDecoration: lesson.count > 0 ? "underline" : "none",
                      backgroundColor: currentRowIndex % 2 === 0 ? "#3a3a44" : "#4d4d59"
                    }}
                    onClick={() => lesson.count > 0 && handleCellClick(lesson.lessonName)}
                  >
                    {lesson.count}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {popupData && (
        <div
          className={s.popupOverlay}
          style={{
            position: "fixed",
            top: "62px",
            left: 0,
            width: "100vw",
            height: "calc(100vh - 50px)",
            backgroundColor: "rgba(77, 77, 89, 0.95)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100000,
            overflowY: "auto"
          }}
          onClick={closePopup}
        >
          <div
            className={s.popupContent}
            style={{
              backgroundColor: "#3a3a44",
              color: "#fff",
              borderRadius: "8px",
              padding: "30px",
              minWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ textAlign: "center", marginBottom: "20px" }}>{popupData.title}</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>ПХ ник</th>
                  <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>ЛК ник</th>
                  <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>ТГ юзернейм</th>
                  <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>ТГ имя</th>
                  <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>ID</th>
                  <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>Профиль PH</th>
                </tr>
              </thead>
              <tbody>
                {popupData.users.map((user, index) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #fff", padding: "8px" }}>{user.nickname}</td>
                    <td style={{ border: "1px solid #fff", padding: "8px" }}>{user.lk_username}</td>
                    <td style={{ border: "1px solid #fff", padding: "8px" }}>{user.tg_username}</td>
                    <td style={{ border: "1px solid #fff", padding: "8px" }}>{user.th_nickname}</td>
                    <td style={{ border: "1px solid #fff", padding: "8px" }}>{user.id}</td>
                    <td style={{ border: "1px solid #fff", padding: "8px" }}>
                      <a href={user.url} target="_blank" rel="noopener noreferrer" style={{ color: "#1E90FF" }}>
                        Открыть
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              style={{
                display: "block",
                margin: "0 auto",
                padding: "10px 20px",
                backgroundColor: "#1E90FF",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
              onClick={closePopup}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}