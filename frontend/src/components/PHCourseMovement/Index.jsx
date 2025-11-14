// CourseProgress.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "semantic-ui-css/semantic.min.css";
import { Dropdown, Button, Container, Form, Loader } from "semantic-ui-react";
import CourseProgressTable from "./CourseProgressTable";

const CourseProgress = () => {
  const [courseId, setCourseId] = useState("");
  const [filteredCourse, setFilteredCourse] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);
  const [coursesData, setCoursesData] = useState(null); // Новое состояние для хранения данных о курсах

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.post("https://pokerhub.pro/api/tg/get-courses");
        setCoursesData(response.data); // Сохраняем данные в состояние
        
        // Преобразуем данные для выпадающего списка
        const courses = Object.entries(response.data).map(([id, course]) => ({
          key: id,
          text: `${id} ${course.name}`,
          value: id
        }));
        setCourseOptions(courses);
      } catch (error) {
        console.error("Ошибка загрузки курсов", error);
        alert("Не удалось загрузить список курсов");
      }
    };
    fetchCourses();
  }, []);
  
  const handleSearch = async () => {
    if (!courseId) {
      alert("Пожалуйста, выберите курс перед поиском.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "https://pokerhub.pro/api/tg/getusers",
        {
          authorization: {
            start: startDate || null,
            end: endDate || null
          },
          courses: [courseId]
        }
      );
      
      setData(response.data);
      setFilteredCourse(courseId); // Обновляем filteredCourse только при поиске
    } catch (error) {
      console.error("Ошибка загрузки данных", error);
      alert("Не удалось загрузить данные о прогрессе");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      style={{
        backgroundColor: "#2A2A32",
        color: "#FFFFFF",
        padding: "20px",
        borderRadius: "5px",
        width: "100%",
      }}
    >
      <Form>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ color: "#FFFFFF", marginBottom: "5px" }}>Курс</label>
            <Dropdown
              placeholder="Выберите курс"
              fluid
              selection
              options={courseOptions}
              value={courseId}
              onChange={(e, { value }) => setCourseId(value)} // Только обновляем courseId
              style={{
                height: "40px",
                backgroundColor: "#FFFFFF",
                color: "#666666",
                borderRadius: "5px",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ color: "#FFFFFF", marginBottom: "5px" }}>Зарегистрированы на платформе ПХ с</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                height: "40px",
                padding: "8px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#FFFFFF",
                color: "#666666",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ color: "#FFFFFF", marginBottom: "5px" }}>По</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                height: "40px",
                padding: "8px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#FFFFFF",
                color: "#666666",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            justifyItems: "center",
            marginBottom: "20px",
          }}
        >
          <div></div>
          <Button onClick={handleSearch} color="blue" style={{ width: "200px", height: "40px" }}>
            Поиск
          </Button>
          <div></div>
        </div>
      </Form>

      {loading && <Loader active inline="centered" style={{ marginTop: "20px" }}>Загрузка...</Loader>}

      {data && (
        <div style={{ marginTop: "20px", color: "#FFFFFF", width: "100%", overflowX: "auto" }}>
          <CourseProgressTable
            data={data}
            selectedCourse={filteredCourse}
            courseOptions={courseOptions}
            coursesData={coursesData} // Передаем данные о курсах
          />
        </div>
      )}
    </Container>
  );
};

export default CourseProgress;