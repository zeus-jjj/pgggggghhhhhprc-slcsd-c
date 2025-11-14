import React, { useState } from "react";
import { FiDownload } from "react-icons/fi"; // Иконка для кнопки
import s from './styles.module.css';

export default function Table({ general, files, users }) {
    const [popupData, setPopupData] = useState(null);

    // Extract data from files
    const fileColumns = files.map((file) => {
        return {
            date: file.date,
            data: file.data
        };
    });

    const handleRowClick = (rowId, columnIndex) => {
        const columnUsers = fileColumns[columnIndex]?.data?.[rowId]?.users || [];
        if (columnUsers.length === 0) return; // Only show popup if users array is not empty

        const columnUsersData = columnUsers.map((id) => {
            const userData = users[id] || {};
            return {
                nickname: userData.nickname || "Ник не указан",
                tg_username: userData.tg_username || "Ник не указан",
                lk_username: userData.lk_username || "Ник не указан",
                th_nickname: userData.th_nickname || "Ник не указан",
                id: userData.tg_id || id,
                date: userData.registration || "Дата не указана",
                url: `https://pokerhub.pro/profile/${id}`,
                link: `https://telegram.pokerhub.pro/profile/${userData.tg_id}`,  // Adding the new 'link' property
            };
        });
        setPopupData({ title: `Детали ${rowId}`, users: columnUsersData });
    };

    const closePopup = () => setPopupData(null);

    const exportToCSV = () => {
        if (!general || !files) return;

        let csvContent = "data:text/csv;charset=utf-8,";

        // Заголовки таблицы
        let headers = ["ID", "Название", "Всего", ...files.map(file => file.date)];
        csvContent += headers.join(",") + "\n";

        // Данные
        general.forEach(row => {
            let rowData = [
                `"${row.id}"`,  // ID
                `"${row.name}"`, // Название
                row.value || "-" // Всего
            ];

            files.forEach(file => {
                rowData.push(file.data?.[row.id]?.value || "-");
            });

            csvContent += rowData.join(",") + "\n";
        });

        // Создание ссылки для скачивания
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `export_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    // Проверка на целое число
    const isWholeNumber = (id) => /^\d+$/.test(id);

    // Проверка на формат X.Y (одна точка)
    const isDecimalFormat = (id) => /^\d+\.\d+$/.test(id);

    const hasTwoDots = (id) => (id.match(/\./g) || []).length === 2;

    return (
        <div className={s.tableWrapper} style={{ overflowX: "auto", height: "100vh", display: "flex", flexDirection: "column" }}>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 50px)', marginTop: '0' }}>
                <table className={s.table} cellPadding="10" cellSpacing="0" style={{ width: '100%' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#4d4d59', zIndex: 2 }}>
                    <tr>
                        <th style={{ padding: "20px 10px", backgroundColor: "#4d4d59", color: "#fff", position: "sticky", top: 0, zIndex: 2, left: 0, width: '600px' }}>
                                <span></span> {/* Пустое пространство */}
                                <button
                                    onClick={exportToCSV}
                                    style={{
                                        backgroundColor: "#28a745",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "40px",
                                        height: "40px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        transition: "background 0.3s ease",
                                    }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = "#218838"}
                                    onMouseOut={(e) => e.target.style.backgroundColor = "#28a745"}
                                    title="Экспорт в CSV"
                                >
                                    <FiDownload size={20} color="white" />
                                </button>
                            </th>
                        <th style={{ textAlign: "left", padding: "20px 10px", backgroundColor: "#4d4d59", color: "#fff", position: "sticky", top: 0, zIndex: 2, width: '100px', fontSize: "17px" }}>Всего</th>
                        {fileColumns.map((file, index) => (
                            <th key={index} style={{
                                textAlign: "left", padding: "20px 10px", backgroundColor: index % 2 === 0 ? "#3a3a44" : "#4d4d59", color: "#fff", position: "sticky", top: 0, zIndex: 2, fontSize: "17px", width: `${file.date.length * 10.7}px`
                            }}>
                                {file.date}
                            </th>
                        ))}
                        <th style={{ padding: "20px 10px", backgroundColor: "#4d4d59", color: "#fff", position: "sticky", top: 0, zIndex: 2, left: 0, width: '100%' }}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {general.map((row, rowIndex) => (
                        <tr key={row.id} style={{
                            backgroundColor: isWholeNumber(row.id)
                                ? "#202027" // Цвет для целых чисел
                                : isDecimalFormat(row.id)
                                    ? "#292954" // Цвет для формата X.Y
                                    : rowIndex % 2 === 0
                                        ? "#3a3a44"
                                        : "#4d4d59",
                        }}>
                            <td style={{
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "2px 10px",
                                backgroundColor: isWholeNumber(row.id)
                                    ? "#202027"
                                    : isDecimalFormat(row.id)
                                        ? "#292954"
                                        : rowIndex % 2 === 0
                                            ? "#3a3a44"
                                            : "#4d4d59",
                                color: "#fff", position: 'sticky', left: 0, zIndex: 1,
                            }}>

                                {
                                    isDecimalFormat(row.id) ?
                                        `⠀⠀⠀${row.id} ${row.name}` : hasTwoDots(row.id) ?
                                            `⠀⠀⠀⠀⠀⠀${row.id} ${row.name}` : <span style={{fontSize: "17px", fontWeight: "bolder"}}>{`${row.id} ${row.name}`}</span>

                                }
                            </td>
                            <td style={{
                                padding: "2px 10px", backgroundColor: isWholeNumber(row.id)
                                    ? "#202027"
                                    : isDecimalFormat(row.id)
                                        ? "#292954"
                                        : rowIndex % 2 === 0
                                            ? "#3a3a44"
                                            : "#4d4d59", color: "#fff", cursor: "default",
                            }}>
                                {row.value || "-"} {/* Всегда отображаем значения */}
                            </td>
                            {fileColumns.map((file, columnIndex) => (
                                <td key={columnIndex} style={{
                                    padding: "2px 10px",
                                    backgroundColor: isWholeNumber(row.id)
                                        ? "#202027"
                                        : isDecimalFormat(row.id)
                                            ? "#292954"
                                            : rowIndex % 2 === 0
                                                ? columnIndex % 2 === 0
                                                    ? "#2a2a33"
                                                    : "#3a3a44"
                                                : columnIndex % 2 === 0
                                                    ? "#3a3a44"
                                                    : "#4d4d59",
                                    color: "#fff",
                                    cursor: file.data?.[row.id]?.users?.length > 0 ? "pointer" : "default",
                                    textDecoration: file.data?.[row.id]?.users?.length > 0 ? "underline" : "unset"
                                }} onClick={() => file.data?.[row.id]?.users?.length > 0 && handleRowClick(row.id, columnIndex)}>
                                    {file.data?.[row.id]?.value || "-"}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {popupData && (
                <div className={s.popupOverlay} style={{
                    position: "fixed", top: "62px", left: 0, width: "100vw", height: "100vh",
                    backgroundColor: "rgba(77, 77, 89, 0.95)", display: "flex", justifyContent: "center", alignItems: "center",
                    zIndex: 100000, overflowY: "auto"
                }} onClick={closePopup}>
                    <div className={s.popupContent} style={{
                        backgroundColor: "#3a3a44", color: "#fff", borderRadius: "8px", padding: "30px",
                        minWidth: "900px", maxWidth: "1600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)", position: "relative"
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ textAlign: "center", marginBottom: "20px" }}>{popupData.title}</h3>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                            <thead>
                            <tr>
                                <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>ПХ ник</th>
                                <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>ЛК ник</th>
                                <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>ТГ юзернейм</th>
                                <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>ТГ имя</th>
                                <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>ID</th>
                                <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>Дата</th>
                                <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>Профиль PH</th>
                                <th style={{ border: "1px solid #fff", padding: "8px", backgroundColor: "#4d4d59" }}>Профиль TG</th>
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
                                    <td style={{ border: "1px solid #fff", padding: "8px" }}>{user.date}</td>
                                    <td style={{ border: "1px solid #fff", padding: "8px" }}>
                                        <a href={user.url} target="_blank" rel="noopener noreferrer" style={{ color: "#1E90FF" }}>Открыть</a>
                                    </td>
                                    <td style={{ border: "1px solid #fff", padding: "8px" }}>
                                        <a href={user.link} target="_blank" rel="noopener noreferrer" style={{ color: "#1E90FF" }}>Открыть</a>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <button style={{
                            display: "block", margin: "0 auto", padding: "10px 20px", backgroundColor: "#1E90FF",
                            color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer"
                        }} onClick={closePopup}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
