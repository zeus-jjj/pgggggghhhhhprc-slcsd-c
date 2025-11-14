import React, { useState } from "react";
import axios from "axios";
import "semantic-ui-css/semantic.min.css";
import { Dropdown, Button, Container, Form, Loader } from "semantic-ui-react";
import Table from "./table";

const PokerhubStats = () => {
  const [type, setType] = useState(null);
  const [category, setCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const typeOptions = [
    { key: 1, text: "Ежедневный", value: 1 },
    { key: 2, text: "Еженедельный", value: 2 },
    { key: 3, text: "Месячный", value: 3 },
    { key: 4, text: "Квартальный", value: 4 },
    { key: 5, text: "Годовой", value: 5 },
  ];

  const generateCategoryOptions = (general) => {
    const categories = general
      .filter((item) => /^\d+$/.test(item.id))
      .map((item) => ({
        key: item.id,
        text: `${item.id} ${item.name}`,
        value: item.id,
      }));
    setCategoryOptions([{ key: "all", text: "Все", value: "all" }, ...categories]);
  };

  const handleSearch = async () => {
    if (!type || !startDate || !endDate) {
      alert("Пожалуйста, заполните все поля.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `https://telegram.firestorm.team/phpanel/list-files?start=${startDate}&end=${endDate}&type=${type}`
      );
      setData(response.data);
      setCategory("all");
      generateCategoryOptions(response.data.general);
    } catch (error) {
      console.error("Ошибка загрузки данных", error);
      alert("Не удалось загрузить данные. Пожалуйста, попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (!data) return null;
    if (category === "all") return data;

    return {
      ...data,
      general: data.general.filter((item) => item.id.startsWith(category)),
      files: data.files
        .map((file) => ({
          ...file,
          data: Object.fromEntries(
            Object.entries(file.data).filter(([key]) => key.startsWith(category))
          ),
        }))
        .filter((file) => Object.keys(file.data).length > 0),
    };
  };

  const filtered = filterData();

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
        {/* Первая строка: Тип, Дата от, Дата до */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
            alignItems: "center",
          }}
        >
          {/* Тип */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ color: "#FFFFFF", marginBottom: "5px" }}>Тип</label>
            <Dropdown
              placeholder="Выберите тип"
              fluid
              selection
              options={typeOptions}
              onChange={(e, { value }) => setType(value)}
              style={{
                height: "40px",
                backgroundColor: "#FFFFFF",
                color: "#666666",
                borderRadius: "5px",
              }}
            />
          </div>

          {/* Дата от */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ color: "#FFFFFF", marginBottom: "5px" }}>Дата от</label>
            <input
              type="date"
              className="form-control"
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

          {/* Дата до */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ color: "#FFFFFF", marginBottom: "5px" }}>Дата до</label>
            <input
              type="date"
              className="form-control"
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

        {/* Вторая строка: Кнопка Поиск в центре */}
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

        {/* Третья строка: Категория (только если есть данные) */}
        {!loading && data && filtered && filtered.files && filtered.files.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
              alignItems: "center",
            }}
          >
            {/* Категория (в первой ячейке) */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ color: "#FFFFFF", marginBottom: "5px" }}>Категория</label>
              <Dropdown
                placeholder="Выберите категорию"
                fluid
                selection
                options={categoryOptions}
                value={category}
                onChange={(e, { value }) => setCategory(value)}
                style={{
                  height: "40px",
                  backgroundColor: "#FFFFFF",
                  color: "#666666",
                  borderRadius: "5px",
                }}
              />
            </div>

            <div></div>
            <div></div>
          </div>
        )}
      </Form>

      {/* Лоадер */}
      {loading && <Loader active inline="centered" style={{ marginTop: "20px" }}>Загрузка...</Loader>}

      {/* Таблица */}
      {filtered && (
        <div style={{ marginTop: "20px", color: "#FFFFFF", width: "100%", overflowX: "auto" }}>
          <Table files={filtered.files} general={filtered.general} users={filtered.users} />
        </div>
      )}
    </Container>
  );
};

export default PokerhubStats;
