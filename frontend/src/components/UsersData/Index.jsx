// import React from 'react';

// const Index = () => {
//     return (
//         <div style={{ width: '100%', height: '100%' }}>
//             <iframe
//                 src="https://telegram.pokerhub.pro/users_data"
//                 title="UserData"
//                 width="100%"
//                 height="800px"
//                 style={{ border: 'none' }}
//             />
//         </div>
//     );
// };

// export default Index;


import React, { useEffect } from 'react';



const Index = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.innerHTML = `
        // Для наполнения графиков данными
        function renderCharts(data) {
            // для линейного графика
            const lines_chart_data = data['line_dates_chart'];
            // для круговых диаграмм
            const circle_chart_data = data['circle_charts_data']
            // для столбчатой диаграммы
            const bar_chart_data = data['bar_chart_data']

            // линейный график
            Highcharts.chart('line_chart_container', {
                accessibility: 
                {
                    enabled: false 
                },
                title: {
                    text: lines_chart_data['title'],
                    style: {
                        color: "#ffffff"
                    }
                },
                caption: {
                    style: {
                        color: "#ffffff"
                    }
                },
                yAxis: {
                    title: {
                        text: '<b>Количество пользователей</b>',
                        style: {
                            color: "#ffffff"
                            }
                    },
                    labels: {
                        style: {
                            color: "#ffffff"
                        }
                    }
                },
                xAxis: {
                    title: {
                        text: '<b>День</b>',
                        style: {
                            color: "#ffffff"
                            }
                    },
                    type: 'datetime',
                    labels: {
                        style: {
                            color: "#ffffff"
                        }
                    }
                },
                chart: {
                    backgroundColor: '#2A2A32',
                    polar: true,
                    type: 'line'
                },
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'middle',
                    title: {
                        text: "Метки",
                        style: {
                            color: "#ffffff"
                        }
                    },
                    itemStyle: {
                        color: '#ffffff',
                        fontWeight: 'bold',
                    }
                },
                plotOptions: {
                    series: {
                        pointStart: Date.UTC(lines_chart_data['start_date']['year'], lines_chart_data['start_date']['month'], lines_chart_data['start_date']['day']),
                        pointInterval: 24 * 3600 * 1000, // one day
                        marker: {
                            enabled: lines_chart_data['dots'],
                            states: {
                                hover: {
                                    enabled: lines_chart_data['dots']
                                }
                            }
                        }
                    },
                },
                credits: {
                    enabled: false
                },
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.y}</b><br/>',
                    shared: true
                },
                series: lines_chart_data['data'],
            });

            // круговые диаграммы
            var seriesData = [];
            // Преобразование данных
            Object.keys(circle_chart_data['data']).forEach(function(key) {
                var item = circle_chart_data['data'][key];
                var dataPoints = item.data.map(function(dataItem) {
                    return {
                        name: dataItem.name,
                        y: dataItem.y
                        // Добавьте другие свойства, если необходимо (sliced, selected и т.д.)
                    };
                });

                seriesData.push({
                    name: item.name,
                    center: item.center,
                    size: item.size,
                    colorByPoint: item.colorByPoint,
                    data: dataPoints
                });
            });

            // круговая диаграмма
            Highcharts.chart('circle_chart_container', {
                chart: {
                    backgroundColor: '#2A2A32',
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    type: 'pie'
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: circle_chart_data['title'],
                    style: {
                    color: "#ffffff"
                    }
                },
                tooltip: {
                    headerFormat: '{series.name}<br/>',
                    pointFormat: '<b>{point.name}: {point.percentage:.1f}%</b><br/>',
                    footerFormat: 'Юзеров: {point.y}'
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '{point.name}: {point.percentage:.1f} %',
                            style: {
                                color: "#ffffff"
                            }
                        }
                    }
                },
                series: seriesData
            });


            // столбчатая диаграмма
            Highcharts.chart('bar_chart_container', {
                chart: {
                    type: 'column',
                    backgroundColor: '#2A2A32'
                },
                title: {
                    text: bar_chart_data['title'],
                    style: {
                        color: "#ffffff"
                        }
                },
                xAxis: {
                    type: 'category',
                    labels: {
                            style: {
                                color: "#ffffff"
                            }
                        },
                    title: {
                        text: '<b>Откуда пришел юзер</b>',
                        style: {
                            color: "#ffffff"
                            }
                        },
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: '<b>Количество пользователей</b>',
                        style: {
                            color: "#ffffff"
                            }
                        },
                    labels: {
                                style: {
                                    color: "#ffffff"
                                }
                            }
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            format: '{point.y}'
                        }
                    }
                },
                tooltip: {
                    headerFormat: '',
                    pointFormat: '{point.name}: {point.y}'
                },
                credits: {
                            enabled: false
                        },
                series: [{
                    name: 'Откуда пришел юзер',
                    colorByPoint: true,
                    data: bar_chart_data['data']
                }],
            });
        }

        // Функция для переключения вкладок
        function switchTab(tabId) {
            // Скрыть все вкладки
            const tabs = document.querySelectorAll('.tab-pane');
            tabs.forEach(tab => {
                tab.classList.remove('show', 'active');
            });

            // Показать выбранную вкладку
            const selectedTab = document.getElementById(tabId);
            selectedTab.classList.add('show', 'active');

            // Применить активный класс к выбранной вкладке и убрать его с остальных
            const tabButtons = document.querySelectorAll('.nav-link');
            tabButtons.forEach(tabButton => {
                tabButton.classList.remove('active');
            });
            document.getElementById(tabId + '-tab').classList.add('active');
        }

        function highlightCells() {
            document.querySelectorAll('.check-inner').forEach(td => {
                // Получаем вложенный .td-inner
                const cell = td.querySelector('.td-inner');

                // Проверяем, есть ли внутри .td-inner что-то для проверки
                if (cell) {
                    const fullHeight = cell.scrollHeight; // Полная высота контента внутри .td-inner
                    const visibleHeight = cell.clientHeight; // Видимая высота .td-inner

                    // Если полная высота больше видимой, значит текст обрезан
                    if (fullHeight > visibleHeight && td.style.backgroundColor !== '#444458') {
                        td.style.backgroundColor = '#444458';
                    } else if (fullHeight <= visibleHeight && td.style.backgroundColor !== '') {
                        td.style.backgroundColor = '';
                    }
                }
            });
        }

        async function applyFilter() {
            showLoadingModal();
            try{
                const form = document.querySelector('#filterForm');
                const formData = new FormData(form);

                const filterData = {};
                filterData['pokerhub_utm'] = {};
                
                const isBlockedValues = [];
                if (formData.get('is_blocked') === '1') {
                    isBlockedValues.push(true); 
                }
                if (formData.get('is_not_blocked') === '0') {
                    isBlockedValues.push(false);
                }
                if (isBlockedValues.length) {
                    filterData['is_blocked'] = isBlockedValues;
                }

                // Обработка других элементов формы, включая дата-пикеры и выпадающие списки
                formData.forEach((value, key) => {
                    if (key.startsWith('PH_UTM')) {
                        let trueKey = key.slice(6, -2);
                        if (!filterData['pokerhub_utm'][trueKey]) {
                            filterData['pokerhub_utm'][trueKey] = [];
                        }
                        filterData['pokerhub_utm'][trueKey].push(value);
                    } else if (key.endsWith('[]')) {
                        // Обработка списков с множественным выбором (dropdowns)
                        let trueKey = key.slice(0, -2);
                        if (!filterData[trueKey]) {
                            filterData[trueKey] = [];
                        }
                        filterData[trueKey].push(value);
                    } else if (key === 'revfunnel[]') {
                        if (!filterData['revfunnel']) {
                            filterData['revfunnel'] = [];
                        }
                        filterData['revfunnel'].push(value);
                    } else {
                        // Обработка одиночных данных и чекбоксов
                        if (key == 'date_start' || key == 'date_end' || 
                            key == 'ph_reg_start' || key == 'ph_reg_end' || 
                            key == 'ph_last_activity_start' || key == 'ph_last_activity_end') {
                            filterData[key] = value || null; // Введение null для пустых дат
                        } else if (formData.get(key) !== '' && !(key in filterData)) {
                            // Убедимся, что данные еще не существуют
                            filterData[key] = value;
                        }
                    }
                });

                // Добавляем выбранное значения радиокнопки (только с регой ПХ / только без реги ПХ / все юзеры)
                const userType = formData.get('user_type');
                if (userType) {
                    filterData['user_type'] = userType;
                }

                // Обычная отправка данных
                const response = await fetch('https://telegram.pokerhub.pro/api/users_data/filter', {
                // const response = await fetch('http://localhost:3095/api/users_data/filter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(filterData),
                });

                if (response.ok) {
                    const data = await response.json();
                    populateTable(data);
                    renderCharts(data['charts'])
                    highlightCells();
                    hideLoadingModal();
                }
            } catch (error) {
                console.error('Ошибка при загрузке данных: ', error);
                showLoadingModal('Произошла ошибка при загрузке данных. Повторить попытку?', true);
            }
        }

        function showLoadingModal(message = "Загрузка данных...", isError = false) {
            document.getElementById('loadingOverlay').style.display = 'block';
            document.getElementById('loadingModal').style.display = 'block';
            const loadingSpinner = document.getElementById('loadingSpinner');
            const loadingMessage = document.getElementById('loadingMessage');
            const errorMessage = document.getElementById('errorMessage');
            const loadingButtons = document.getElementById('loadingButtons');

            if (isError) {
                loadingSpinner.style.display = 'none';
                loadingMessage.style.display = 'none';
                errorMessage.style.display = 'block';
                errorMessage.textContent = message;
                loadingButtons.style.display = 'block';
            } else {
                loadingSpinner.style.display = 'inline-block';
                loadingMessage.style.display = 'block';
                loadingMessage.textContent = message;
                errorMessage.style.display = 'none';
                loadingButtons.style.display = 'none';
            }
        }

        // Функция скрытия модального окна загрузки
        function hideLoadingModal() {
            document.getElementById('loadingOverlay').style.display = 'none';
            document.getElementById('loadingModal').style.display = 'none';
        }

        // Обработчики для кнопок внутри модального окна
        document.getElementById('retryButton').addEventListener('click', async function() {
            showLoadingModal(); // Показать спиннер без ошибки
            await applyFilter(); // Повторить попытку
        });

        // Функция для экспорта таблицы в формате CSV
        function downloadTableAsCSV() {
            const rows = Array.from(document.querySelectorAll("#dataBodyUsers tr"));
            const headers = Array.from(document.querySelectorAll(".table th")).map((th) =>
                th.innerText.trim()
            );

            // Извлечение уникальных меток из bot-UTM и PH-UTM для создания дополнительных столбцов
            const utmHeaders = new Set();
            const phUtmHeaders = new Set();
            rows.forEach((row) => {
                const botUtmCell = row.children[7]?.querySelector('.td-inner')?.innerText || ''; // Индекс 7 для bot-UTM
                const phUtmCell = row.children[9]?.querySelector('.td-inner')?.innerText || ''; // Индекс 9 для PH-UTM

                // Обработка bot-UTM
                if (botUtmCell && botUtmCell !== 'Нет данных') {
                    botUtmCell.split(/\\r?\\n/).forEach(line => {
                        const [key] = line.split(':').map(s => s.trim());
                        if (key) utmHeaders.add(key);
                    });
                }

                // Обработка PH-UTM
                if (phUtmCell && phUtmCell !== 'Нет данных') {
                    phUtmCell.split(/\\r?\\n/).forEach(line => {
                        const [key] = line.split(':').map(s => s.trim());
                        if (key) phUtmHeaders.add(key);
                    });
                }
            });

            // Преобразование Set в массив и добавление префиксов для уникальности
            const botUtmHeadersArray = Array.from(utmHeaders).map(key => \`bot-\${key}\`);
            const phUtmHeadersArray = Array.from(phUtmHeaders).map(key => \`ph-\${key}\`);

            // Обновлённые заголовки с учётом новых столбцов
            const allHeaders = [
                ...headers.slice(0, 7), // От № до Заблокировал
                ...botUtmHeadersArray,   // Динамические столбцы для bot-UTM
                headers[8],              // BOT RAW
                ...phUtmHeadersArray,    // Динамические столбцы для PH-UTM
                headers[10],             // PH RAW
                ...headers.slice(11)     // От Регистрация ПХ до История бота
            ];

            // Формирование данных для CSV
            const csvContent = [
                allHeaders.join(";"),
                ...rows.map((row) => {
                    try {
                        const columns = [];
                        // Обработка всех столбцов по порядку
                        Array.from(row.children).forEach((td, index) => {
                            if (index < 7 || (index > 7 && index !== 7 && index !== 9)) { // Столбцы до bot-UTM, BOT RAW, PH RAW и после, пропуская только UTM
                                let cellText = td?.innerText?.trim() || '';
                                if (td?.querySelectorAll('.course-item').length > 0) {
                                    const courseItems = Array.from(td.querySelectorAll('.course-item'));
                                    let courseData = courseItems.map(item => {
                                        const name = item.innerText.trim();
                                        const tooltipData = item.getAttribute("title")?.replace(/\\n/g, ", ") || '';
                                        return \`\${name}: [\${tooltipData}]\`;
                                    }).join("; ");
                                    cellText = \`"\${courseData}"\`;
                                } else if (td?.querySelectorAll('.group-item').length > 0) {
                                    const groupItems = Array.from(td.querySelectorAll('.group-item'));
                                    let groupData = groupItems.map(item => item.innerText.trim()).join("; ");
                                    cellText = \`"\${groupData}"\`;
                                } else if (td?.querySelectorAll('.funnel-history-btn').length > 0) {
                                    const funnelBtn = td.querySelector('.funnel-history-btn');
                                    const onclickAttr = funnelBtn?.getAttribute('onclick');
                                    if (onclickAttr) {
                                        const encodedJson = onclickAttr.match(/'([^']+)'/)[1];
                                        const funnelHistory = JSON.parse(decodeURIComponent(encodedJson));
                                        cellText = \`"\${funnelHistory
                                            .map(item => \`\${item.label}: \${new Date(item.date).toLocaleString('ru-RU')}\`)
                                            .join("; ")}"\`;
                                    } else {
                                        cellText = \`"\${cellText.replace(/"/g, '""')}"\`;
                                    }
                                } else {
                                    cellText = \`"\${cellText.replace(/"/g, '""')}"\`;
                                }
                                columns.push(cellText);
                            } else if (index === 7 || index === 9) { // Обработка bot-UTM и PH-UTM
                                const isBotUtm = index === 7;
                                const utmData = td?.querySelector('.td-inner')?.innerText || '';
                                const utmHeadersArray = isBotUtm ? botUtmHeadersArray : phUtmHeadersArray;
                                const utmMap = {};
                                if (utmData && utmData !== '') {
                                    utmData.split(/\\r?\\n/).forEach(line => {
                                        const [key, value] = line.split(':').map(s => s.trim());
                                        if (key) utmMap[key] = value || '';
                                    });
                                }
                                // Добавляем значения для каждого заголовка
                                utmHeadersArray.forEach(header => {
                                    const key = isBotUtm ? header.replace('bot-', '') : header.replace('ph-', '');
                                    columns.push(\`"\${utmMap[key] || ''}"\`);
                                });
                            }
                        });
                        return columns.join(";");
                    } catch (error) {
                        console.error('Ошибка при обработке строки:', error);
                        return [];
                    }
                })
            ].join("\\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().split('T')[0];
            const formattedTime = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
            const fileName = \`bot_users_export_\${formattedDate}_\${formattedTime}.csv\`;

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", fileName);
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }

        function generateGroupsHtml(groups) {
            if (!Array.isArray(groups)) {
                console.error('Ошибка: ожидаемый массив групп не является массивом', groups);
                return 'Нет данных';
            }

            const groupsData = groups.map(groupName => ({
                name: groupName
            }));

            return groupsData.map(data => \`<div class="group-item">\${data.name}</div>\`).join('');
        }

        function phUtmToHtml(phUtm) {
            if (!phUtm || phUtm === null) {
                return '';
            }
            if (typeof phUtm === 'object' && !Array.isArray(phUtm)) {
                return Object.entries(phUtm)
                    .map(([key, value]) => \`\${key}: \${value || ''}\`)
                    .join('<br>');
            }
            return phUtm.toString();
        }

        function populateTable(data) {
            const dataUsers = data['users'];
            const dataGeneral = data['general'];
            const dataPhUtm = data['ph_utms']
            const tableUsers = document.querySelector('#dataBodyUsers');
            const tableGeneral = document.querySelector('#dataBodyGeneral');
            const tablePhUtm = document.querySelector('#dataPhUtmGeneral');
            tableUsers.innerHTML = ''; // Очищаем содержимое таблицы
            tableGeneral.innerHTML = '';
            tablePhUtm.innerHTML = '';

            dataUsers.forEach((row, index) => {
                const tr = document.createElement('tr');
                const utmToHtml = (utm) => {
                    return Object.entries(utm)
                        .map(([key, value]) => \`<div>\${key}: \${value}</div>\`)
                        .join('');
                };

                const coursesData = Object.keys(row.courses).map(courseName => ({
                    name: courseName,
                    count: row.courses[courseName].length,
                    items: row.courses[courseName]
                }));

                const coursesHtml = coursesData.map(data => {
                    const tooltipTitle = data.items.join('\\n');
                    return \`<div class="course-item" title="\${tooltipTitle}">\${data.name} (\${data.count})</div>\`;
                }).join('');

                const groupsHtml = generateGroupsHtml(row.group);

                tr.innerHTML = \`
                    <td>\${index + 1}</td>
                    <td>
                        <div class="mail-icon" onclick="showPopup(\${row.id})">
                            <div class="user-id">\${row.id}</div>
                            <img src="https://cdn-icons-png.flaticon.com/512/2511/2511833.png" alt="mail icon">
                        </div>
                    </td>
                    <td>\${row.username}</td>
                    <td>\${row.first_name}</td>
                    <td>\${row.last_name}</td>
                    <td>\${row.registration}</td>
                    <td>\${row.is_blocked ? 'Да' : 'Нет'}</td>
                    <td class="text-pointer check-inner"><div class="td-inner">\${utmToHtml(row.utm)}</div></td>
                    <td class="copyable-cell"><a href="\${row.raw_link}" target="_blank">\${row.raw_link}</a></td>
                    <td class="text-pointer check-inner"><div class="td-inner">\${phUtmToHtml(row.ph_utm)}</div></td>
                    <td class="copyable-cell"><a href="\${row.referer}" target="_blank">\${row.referer}</a></td>
                    <td>\${row.authorization_date}</td>
                    <td>\${row.last_visit_date}</td>
                    <td class="text-pointer check-inner"><div class="td-inner">\${groupsHtml}</div></td>
                    <td class="text-pointer check-inner"><div class="td-inner">\${coursesHtml}</div></td>
                    <td>\${row.user_funnel || ''}</td>
                    <td><button class="funnel-history-btn" onclick="showFunnelHistoryPopup(\${row.id}, '\${row.funnel_history ? encodeURIComponent(JSON.stringify(row.funnel_history)) : encodeURIComponent('[]')}')">\${row.funnel_history ? row.funnel_history.length : 0}</button></td>
                \`;
                tableUsers.appendChild(tr);
            });

            document.querySelectorAll('.copyable-cell a').forEach(link => {
                link.addEventListener('click', function(event) {
                    event.preventDefault();
                    const text = this.href;
                    navigator.clipboard.writeText(text).then(() => {
                        showNotification('Ссылка скопирована', true, 1000);
                    }).catch(err => {
                        console.error('Ошибка копирования: ', err);
                    });
                });
            });

            const styleEl = document.createElement('style');
            styleEl.innerHTML = \`
                .text-ellipsis {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            \`;
            document.head.appendChild(styleEl);

            dataGeneral.forEach((row, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = \`
                    <td>\${index + 1}</td>
                    <td>\${row.label}</td>
                    <td>\${row.count}</td>\`;
                tableGeneral.appendChild(tr);
            });

            dataPhUtm.forEach((row, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = \`
                    <td>\${index + 1}</td>
                    <td>\${row.label}</td>
                    <td>\${row.count}</td>\`;
                tablePhUtm.appendChild(tr);
            });
        }

        // Показать попап GotoFunnel
        function showGotoFunnelPopup() {
            const popup = document.getElementById('gotoFunnelPopup');
            const select = document.getElementById('gotoFunnelSelect');
            select.innerHTML = ''; // Очистить селект

            // Заполнить селект из funnelData (как в fetchData)
            funnelData.forEach(value => {
                const option = document.createElement('option');
                option.value = value['key'];
                option.textContent = value['label'];
                select.appendChild(option);
            });

            popup.style.display = 'block';
        }

        // Скрыть попап GotoFunnel
        function hideGotoFunnelPopup() {
            const popup = document.getElementById('gotoFunnelPopup');
            popup.style.display = 'none';
        }

        // Обработчик закрытия
        document.getElementById('closeGotoFunnelPopupButton').addEventListener('click', hideGotoFunnelPopup);

        // Обработчик кнопки "Продолжить"
        document.getElementById('continueGotoFunnelButton').addEventListener('click', async function() {
            showLoadingModal("Обработка...", false);
            const datetimeInput = document.getElementById('gotoDatetime').value; // "YYYY-MM-DDTHH:MM"
            const funnel = document.getElementById('gotoFunnelSelect').value;
            const customUserIdsInput = document.getElementById('customUserIdsGoto');
            const customUserIds = customUserIdsInput ? customUserIdsInput.value.trim() : '';
            
            // Инициализируем usersData из таблицы по умолчанию
            let usersData = Array.from(document.querySelectorAll('#dataBodyUsers .user-id')).map(element => element.innerText.trim());

            // Если есть кастомные IDs и они не пустые, используем их вместо таблицы
            if (customUserIds) {
                usersData = customUserIds.split(/[, \\n]+/).filter(id => id.trim() !== ''); // Разделяем по запятой, пробелу или новой строке
            } else if (usersData.length === 0 && !customUserIdsInput) {
                // Если таблица пуста и элемента customUserIdsInput нет, используем пустой массив
                usersData = [];
            }

            // Проверка заполненности всех обязательных полей
            if (!datetimeInput || !funnel || usersData.length === 0) {
                hideLoadingModal();
                showNotification('Заполните все поля', false, false);
                return;
            }

            try {
                const payload = {
                    users: usersData, // Массив или строка в зависимости от источника
                    datetime: datetimeInput,
                    funnel: funnel
                };
                if (customUserIdsInput && customUserIds) {
                    payload.custom_ids = true;
                }

                const response = await fetch('https://telegram.pokerhub.pro/api/users_data/gotofunnel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const responseData = await response.json();

                if (response.status === 200) {
                    showNotification(\`\${responseData.message}\`, true, 1000);
                } else {
                    showNotification(\`\${responseData.error}\`, false, false);
                }
            } catch (error) {
                showNotification(\`Ошибка: \${error}\`, false, false);
                hideLoadingModal();
            }

            hideGotoFunnelPopup();
            hideLoadingModal();
        });

        async function fetchData() {
            try {
                const response = await fetch('https://telegram.pokerhub.pro/api/users_data/get_utm', {
                    method: 'POST'
                });
                const data = await response.json();

                const dropdowns = document.querySelectorAll('.dropdown');

                dropdowns.forEach(dropdown => {
                    const dropdownId = dropdown.querySelector('.dropdown-toggle').id.replace('dropdown', ''); // Получаем id dropdown
                    const dropdownData = data['bot'][dropdownId]; // Получаем данные для текущего dropdown

                    const dropdownMenu = dropdown.querySelector('.dropdown-menu');
                    dropdownMenu.innerHTML = ''; // Очищаем содержимое dropdown

                    // Создаем пункты для каждого значения данных и добавляем их в dropdown
                    dropdownData.forEach(value => {
                        const label = document.createElement('label');
                        label.innerHTML = \`<input type="checkbox" name="\${dropdownId}[]" value="\${value}"> \${value}\`;
                        dropdownMenu.appendChild(label);
                    });
                });

                const dropdownGroups = document.querySelector('.dropdowngroups-menu');
                    dropdownGroups.innerHTML = ''; // Очищаем содержимое dropdown для групп

                    const groupsResponse = await fetch('https://pokerhub.pro/api/tg/getgroups', {
                        method: 'POST'
                    });
                    const groupsData = await groupsResponse.json();

                    for (const key in groupsData) {
                        const label = document.createElement('label');
                        label.innerHTML = \`<input type="checkbox" name="groups[]" value="\${key}"> \${groupsData[key]}\`;
                        dropdownGroups.appendChild(label);
                    }

                const dropdownContainer = document.getElementById('pokerhub-dropdowns');
                dropdownContainer.innerHTML = ''; // Очищаем контейнер перед добавлением новых выпадающих списков

                const funnelDropdownMenu = document.querySelector('.dropdownfunnel-menu');
                funnelDropdownMenu.innerHTML = ''; // Очищаем содержимое dropdown для funnel

                const revfunnelDropdownMenu = document.querySelector('.dropdownrevfunnel-menu');
                revfunnelDropdownMenu.innerHTML = ''; // Очищаем содержимое dropdown для funnel

                const funnelResponse = await fetch('https://telegram.pokerhub.pro/api/users_data/get_funnel', {
                    method: 'POST'
                });
                const funnelData = await funnelResponse.json();
                window.funnelData = funnelData;

                funnelData.forEach(value => {
                    const labelFunnel = document.createElement('label');
                    labelFunnel.innerHTML = \`<input type="checkbox" name="funnel[]" value="\${value['label']}"> \${value['label']}\`;
                    funnelDropdownMenu.appendChild(labelFunnel);

                    const labelRev = document.createElement('label');
                    labelRev.innerHTML = \`<input type="checkbox" name="revfunnel[]" value="\${value['label']}"> \${value['label']}\`;
                    revfunnelDropdownMenu.appendChild(labelRev);
                });

                for (const key in data['pokerhub']) {
                    const newDropdown = document.createElement('div');
                    newDropdown.classList.add('dropdown');
                    newDropdown.innerHTML = \`
                        <button class="btn btn-secondary dropdown-toggle" id="dropdown\${key}" type="button">\${key}</button>
                        <div class="dropdown-menu"></div>
                    \`;
                    dropdownContainer.appendChild(newDropdown);

                    const dropdownMenu = newDropdown.querySelector('.dropdown-menu');
                    data['pokerhub'][key].forEach(value => {
                        const label = document.createElement('label');
                        label.innerHTML = \`<input type="checkbox" name="PH_UTM\${key}[]" value="\${value}"> \${value}\`;
                        dropdownMenu.appendChild(label);
                    });
                }


            } catch (error) {
                console.error('Ошибка при загрузке данных: ', error);
            } finally {
                $(document).ready(function () {
                    // Переключение видимости дропдауна при клике на кнопку
                    $('.btn-secondary').click(function (event) {
                        event.stopPropagation(); // Останавливаем распространение события, чтобы оно не закрыло дропдаун
                        let dropdownMenu = $(this).next('.dropdown-menu');
                        $('.dropdown-menu').not(dropdownMenu).removeClass('show'); // Закрываем другие дропдауны
                        dropdownMenu.toggleClass('show'); // Переключаем видимость текущего дропдауна
                    });

                    // Закрытие всех дропдаунов при клике вне их области
                    $(document).click(function () {
                        $('.dropdown-menu').removeClass('show');
                    });

                    // Останавливаем закрытие дропдауна при клике на элементы внутри него
                    $('.dropdown-menu').click(function (event) {
                        event.stopPropagation();
                    });
                });
            }
        }



        



        // fetchData();
        // applyFilter();


        async function onload() {
            // await applyFilter();
            await fetchData();

            const usersTab = document.getElementById('users-tab');
            const generalTab = document.getElementById('general-tab');
            const graphsTab = document.getElementById('graphs-tab');
            const changeFilterButton = document.getElementById('changeFilterButton');
            const closePopupButton = document.getElementById('closePopupButton');
            const tableElement = document.querySelector('.table');

            if (usersTab) {
              usersTab.addEventListener('click', function() {
                switchTab('users');
              });
            }

            if (generalTab) {
              generalTab.addEventListener('click', function() {
                switchTab('general');
              });
            }

            if (graphsTab) {
              graphsTab.addEventListener('click', function() {
                switchTab('graphs');
              });
            }

            if (changeFilterButton) {
              changeFilterButton.addEventListener('click', () => hideLoadingModal());
            }

            if (closePopupButton) {
              closePopupButton.addEventListener('click', hidePopup);
            }

            if (tableElement) {
              window.addEventListener('resize', highlightCells);
              document.body.addEventListener('mousemove', function(event) {
                // Для взаимного раскрытия 13 и 14 ячеек при наведении мыши
                const handleHover = (event) => {
                  const target = event.target;
                  if (target.matches('.table tr td:nth-child(13), .table tr td:nth-child(13) .td-inner, table tr td:nth-child(13) .td-inner .group-item, .table tr td:nth-child(14) .td-inner, .table tr td:nth-child(14), .table tr td:nth-child(14) .td-inner .course-item')) {
                    const row = target.closest('tr');
                    if (row.children[12]?.querySelector('.td-inner')) {
                      row.children[12].querySelector('.td-inner').style.webkitLineClamp = 'inherit';
                      row.children[12].querySelector('.td-inner').style.lineClamp = 'inherit';
                    }
                    if (row.children[13]?.querySelector('.td-inner')) {
                      row.children[13].querySelector('.td-inner').style.webkitLineClamp = 'inherit';
                      row.children[13].querySelector('.td-inner').style.lineClamp = 'inherit';
                    }
                  }
                };

                // Для сброса стилей при уведении курсора
                const handleMouseOut = (event) => {
                  const target = event.target;
                  if (target.matches('.table tr td:nth-child(12), .table tr td:nth-child(12) .td-inner, table tr td:nth-child(12) .td-inner .group-item, .table tr td:nth-child(13) .td-inner, .table tr td:nth-child(13), .table tr td:nth-child(13) .td-inner .course-item')) {
                    const row = target.closest('tr');
                    if (row.children[12]?.querySelector('.td-inner')) {
                      row.children[12].querySelector('.td-inner').style.webkitLineClamp = 3;
                      row.children[12].querySelector('.td-inner').style.lineClamp = 3;
                    }
                    if (row.children[13]?.querySelector('.td-inner')) {
                      row.children[13].querySelector('.td-inner').style.webkitLineClamp = 3;
                      row.children[13].querySelector('.td-inner').style.lineClamp = 3;
                    }
                    if (row.children[14]?.querySelector('.td-inner')) {
                      row.children[14].querySelector('.td-inner').style.lineClamp = 3;
                    }
                  }
                };

                tableElement.addEventListener('mouseover', handleHover);
                tableElement.addEventListener('mouseout', handleMouseOut);
              });
            }
          };



        // Показать всплывающее окно
        function showPopup(userId = null, isMassMessage = false) {
            const popup = document.getElementById('messagePopup');
            const popupContent = popup.querySelector('.popup-content');
            const popupTitle = isMassMessage ? 'Массовая рассылка' : 'Персональное сообщение';
            
            // Удалить старый заголовок, если он существует
            const oldTitle = popupContent.querySelector('h5');
            if (oldTitle) {
                oldTitle.remove();
            }

            // Добавить новый заголовок
            const titleElement = document.createElement('h5');
            titleElement.innerText = popupTitle;
            titleElement.style.textAlign = 'center'; // Выровнять заголовок по центру
            popupContent.insertAdjacentElement('afterbegin', titleElement);

            popup.style.display = 'block';
            popup.setAttribute('data-user-id', userId || '');
            popup.setAttribute('data-mass-message', isMassMessage);
            // Показать/скрыть поле для ручного ввода IDs только для массовой рассылки
            const customIdsContainer = document.getElementById('customIdsContainer');
            if (isMassMessage) {
                customIdsContainer.style.display = 'block';
            } else {
                customIdsContainer.style.display = 'none';
            }
            // Сбросить текстовое поле, файлы и кнопки
            document.getElementById('messageTextArea').value = '';
            document.getElementById('attachFiles').value = '';
            document.getElementById('filePreview').innerHTML = '';
            document.getElementById('buttonsContainer').innerHTML = '';
        }

        // Обработчик для прикрепления файлов
        document.getElementById('attachFiles').addEventListener('change', function(event) {
            const files = event.target.files;
            const preview = document.getElementById('filePreview');
            preview.innerHTML = ''; // Очистить превью

            if (files.length > 10) {
                showNotification('Максимум 10 изображений', false, false);
                event.target.value = ''; // Сбросить input
                return;
            }

            Array.from(files).forEach((file, index) => {
                if (file.type.startsWith('image/')) {
                    const item = document.createElement('div');
                    item.classList.add('file-preview-item');

                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    item.appendChild(img);

                    const removeBtn = document.createElement('button');
                    removeBtn.classList.add('remove-file');
                    removeBtn.innerText = 'x';
                    removeBtn.onclick = function() {
                        item.remove();
                        // Обновить input файлов (удалить из selected)
                        const dt = new DataTransfer();
                        Array.from(event.target.files).forEach((f, i) => {
                            if (i !== index) dt.items.add(f);
                        });
                        event.target.files = dt.files;
                    };
                    item.appendChild(removeBtn);

                    preview.appendChild(item);
                } else {
                    showNotification('Только изображения', false, false);
                }
            });
        });

        // Обработчик для добавления кнопки
        document.getElementById('addButton').addEventListener('click', addButtonRow);

        function addButtonRow() {
            const container = document.getElementById('buttonsContainer');
            const row = document.createElement('div');
            row.classList.add('button-row');

            // Поле "название"
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.placeholder = 'Название кнопки';
            nameInput.className = 'btn-name';
            row.appendChild(nameInput);

            // Select "тип"
            const typeSelect = document.createElement('select');
            typeSelect.className = 'btn-type';
            ['callback', 'webapp', 'link'].forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                typeSelect.appendChild(option);
            });
            row.appendChild(typeSelect);

            // Третий элемент (conditional)
            const valueField = document.createElement('div');
            valueField.className = 'btn-value-field';
            row.appendChild(valueField);

            // Кнопка удаления
            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-button');
            removeBtn.innerText = 'Удалить';
            removeBtn.onclick = () => row.remove();
            row.appendChild(removeBtn);

            // Рендер третьего столбца в зависимости от типа
            function renderValueField() {
                valueField.innerHTML = '';
                const t = typeSelect.value;

                if (t === 'callback') {
                    const select = document.createElement('select');
                    select.className = 'callback-select';
                    const data = Array.isArray(window.funnelData) ? window.funnelData : [];
                    data.forEach(item => {
                        // подставьте нужное поле с payload: value/payload/key и т.п.
                        const underlying =
                            (item.payload ?? item.value ?? item.key ?? '').toString();
                        const label = (item.label ?? underlying).toString();

                        const opt = document.createElement('option');
                        opt.value = underlying;       // <-- то самое значение для backend (callback_data)
                        opt.textContent = label;      // текст в выпадающем списке
                        select.appendChild(opt);
                    });
                    valueField.appendChild(select);
                } else if (t === 'webapp' || t === 'link') {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.placeholder = 'URL';
                    input.className = 'url-input';
                    valueField.appendChild(input);
                }
            }

            typeSelect.addEventListener('change', renderValueField);

            // Сразу отрисуем по умолчанию (по умолчанию у вас стоит "callback")
            renderValueField();

            container.appendChild(row);
        }




        // Скрыть всплывающее окно
        function hidePopup() {
            const popup = document.getElementById('messagePopup');
            popup.style.display = 'none';
            popup.querySelector('h5').remove(); // Удалить заголовок при закрытии
        }

        // Обработчик отправки сообщения
        document.getElementById('sendMessageButton').addEventListener('click', async function() {
            showLoadingModal("Обработка...", false)
            const popup = document.getElementById('messagePopup');
            const userId = popup.getAttribute('data-user-id');
            const isMassMessage = popup.getAttribute('data-mass-message') === 'true';
            const message = document.getElementById('messageTextArea').value;

            if (isMassMessage) {
                const userIds = Array.from(document.querySelectorAll('#dataBodyUsers .user-id')).map(element => element.innerText.trim());
                await sendMessage(userIds, message);
            } else {
                await sendMessage([userId], message);
            }
            hidePopup();
            hideLoadingModal();
        });

        // Обработчик закрытия всплывающего окна
        document.getElementById('closePopupButton').addEventListener('click', hidePopup);

        // обработчик кнопки массовой рассылки
        document.getElementById('massMessageButton').addEventListener('click', () => {
            showPopup(null, true);
        });

        function showNotification(message, isSuccess, timeout) {
            const notification = document.getElementById('notification');
            const notificationMessage = document.getElementById('notificationMessage');

            notificationMessage.textContent = message;
            notificationMessage.style.backgroundColor = isSuccess ? 'green' : 'red';
            if (!timeout){
                const closeButton = document.createElement('button');
                closeButton.classList.add('close-btn');
                closeButton.innerText = 'Закрыть';
                closeButton.onclick = hideNotification;
                notificationMessage.appendChild(closeButton);
            }
            notification.style.display = 'block';

            if (timeout) {
                setTimeout(() => {
                    notification.style.display = 'none';
                }, timeout);
            }
        }

        function hideNotification() {
            const notification = document.getElementById('notification');
            notification.style.display = 'none';
        }

       async function sendMessage(userIds, message) {
            try {
                const formData = new FormData();
                const customUserIdsInput = document.getElementById('customUserIds');
                const customUserIds = customUserIdsInput ? customUserIdsInput.value.trim() : '';
                const popup = document.getElementById('messagePopup');
                const isMassMessage = popup.getAttribute('data-mass-message') === 'true';

                let usersData = userIds; // По умолчанию IDs из таблицы

                if (isMassMessage) {
                    // Для массового сообщения обрабатываем кастомные IDs, если они есть
                    if (customUserIds) {
                        usersData = customUserIds;
                        formData.append('custom_ids', 'true');
                    }
                }

                formData.append('users', JSON.stringify(usersData)); // Передаём как массив
                formData.append('msg', message);

                // Файлы (до 10 изображений)
                const filesInput = document.getElementById('attachFiles');
                const files = Array.from(filesInput.files).slice(0, 10);
                for (const file of files) {
                    formData.append('files', file, file.name);
                }

                // Сборка кнопок
                const buttons = [];
                document.querySelectorAll('#buttonsContainer .button-row').forEach(row => {
                    const name = row.querySelector('.btn-name')?.value?.trim();
                    const type = row.querySelector('.btn-type')?.value;

                    let value = '';
                    if (type === 'callback') {
                        const sel = row.querySelector('.callback-select');
                        value = sel ? sel.value : '';
                    } else if (type === 'webapp' || type === 'link') {
                        const input = row.querySelector('.url-input');
                        value = input ? input.value.trim() : '';
                    }

                    if (name && type) {
                        buttons.push({ name, type, value });
                    }
                });
                formData.append('buttons', JSON.stringify(buttons));

                const response = await fetch('https://telegram.pokerhub.pro/api/users_data/send_msg', {
                    method: 'POST',
                    body: formData
                });

                const responseData = await response.json();

                if (response.status === 200) {
                    showNotification(\`\${responseData.message}\`, true, 1000);
                    return 200;
                } else {
                    showNotification(\`\${responseData.error}\`, false, false);
                    return false;
                }
            } catch (error) {
                showNotification(\`Ошибка в бэкенде: \${error}\`, false, false);
                return false;
            }
            }

        

        function showFunnelHistoryPopup(userId, encodedFunnelHistory) {
            const popup = document.getElementById('funnelHistoryPopup');
            const tableBody = document.getElementById('funnelHistoryTableBody');
            const funnelHistory = JSON.parse(decodeURIComponent(encodedFunnelHistory));
            tableBody.innerHTML = '';

            funnelHistory.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = \`
                    <td>\${item.label}</td>
                    <td>\${new Date(item.date).toLocaleString('ru-RU')}</td>
                \`;
                tableBody.appendChild(tr);
            });

            const titleElement = popup.querySelector('h5');
            titleElement.innerText = \`История бота для пользователя \${userId}\`;
            popup.style.display = 'block';
        }

        function hideFunnelHistoryPopup() {
            const popup = document.getElementById('funnelHistoryPopup');
            popup.style.display = 'none';
        }

        document.getElementById('funnelHistoryPopup').addEventListener('click', function(event) {
            if (event.target.classList.contains('popup-overlay')) {
                hideFunnelHistoryPopup();
            }
        });

        document.getElementById('closeFunnelHistoryPopupButton').addEventListener('click', hideFunnelHistoryPopup);


        // вызываем функции после загрузки страницы
        onload();

        `;
        
        document.head.appendChild(script);
        

    }, []);






















































   const fullHtml = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Юзеры</title>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <style>
            body {
                background-color: #2A2A32;
                color: #ffffff;
            }

            .dropdown {
                position: relative;
                display: inline-block;
            }

            /* Стили для содержимого выпадающего списка */
            .dropdown-menu {
                display: none;
                position: absolute;
                background-color: #f9f9f9;
                min-width: 160px;
                box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                z-index: 3;
                max-height: 500px;
                overflow-y: auto;
            }

            /* Стили для элементов с чекбоксами внутри выпадающего меню */
            .dropdown-menu label {
                padding: 12px 16px;
                text-decoration: none;
                display: block;
            }

            .btn-secondary {
                margin-right: 10px;
            }

            .table, .table th, .table td {
                color: #FFFFFF;
            }

            td {
                 padding: 10px;
                 border: 1px solid #495057;
            }

            .td-inner {
                 overflow: hidden;
                 display: -webkit-box;
                 -webkit-line-clamp: 3;
                       line-clamp: 3;
                 -webkit-box-orient: vertical;
            }

            .form-group input[type=date] {
                margin-bottom: 10px;
            }

            .dropdown,
            .form-check {
                vertical-align: middle;
            }

            .separator {
                text-align: center;
            }

            .separator hr {
                margin: 0;
                padding: 0;
                border-color: white;
            }

            .filter-panel {
                border-radius: 25px;
                background-color: #22222a; 
                padding: 15px; 
                margin-top: 15px; 
                margin-bottom: 15px; 
            }

            table {
                width: 100% !important;
                table-layout: fixed; 
            }

            /* Стили для кнопки "История бота" */
            .funnel-history-btn {
                background-color: #32cd32;
                color: #fff;
                border: none;
                border-radius: 5px;
                padding: 5px 10px;
                cursor: pointer;
                font-size: 14px;
            }

            .funnel-history-btn:hover {
                background-color: lightgreen;
            }

            /* Стили для всплывающего окна с таблицей funnel_history */
            .funnel-history-popup .popup-content {
                width: 600px;
                max-height: 80vh; /* Ограничиваем высоту до 80% высоты экрана */
                overflow-y: auto; /* Включаем вертикальную прокрутку */
                box-sizing: border-box; /* Учитываем padding в размерах */
            }

            .funnel-history-popup .popup-content table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                max-height: 60vh; /* Ограничиваем высоту таблицы */
                display: block; /* Делаем таблицу блочным элементом для прокрутки */
                overflow-y: auto; /* Включаем прокрутку для таблицы */
            }

            .funnel-history-popup .popup-content tbody {
                display: table; /* Восстанавливаем табличное поведение для tbody */
                width: 100%;
            }

            .funnel-history-popup .popup-content th,
            .funnel-history-popup .popup-content td {
                border: 1px solid #495057;
                padding: 8px;
                text-align: left;
                color: #ffffff;
            }

            .funnel-history-popup .popup-content th {
                background-color: #444458;
            }

            .text-ellipsis:hover {
                cursor: pointer;
            }
            .spinner-border {
                width: 3rem;
                height: 3rem;
            }
            .text-pointer:hover {
                cursor: pointer;
            }

            .course-item {
                color: inherit; /* Оставляет цвет текста унаследованным */
                transition: color 0.3s ease; /* Плавный переход для изменения цвета текста */
            }

            .course-item:hover {
                color: red;
            }

            .group-item {
                color: inherit; /* Оставляет цвет текста унаследованным */
                transition: color 0.3s ease; /* Плавный переход для изменения цвета текста */
            }

            .group-item:hover {
                color: yellow;
            }

            #downloadCsvButton {
                position: fixed;
                bottom: 40px; /* Отступ от края экрана */
                right: 40px; /* Отступ от правого края экрана */
                width: 40px; /* Задайте желаемый размер кнопки */
                height: 40px;
                border-radius: 50%; /* Сделайте кнопку круглой */
                background-color: #32cd32; /* Цвет светло-зеленый */
                color: #fff;
                z-index: 1001; /* Выше, чем попапы (z-index: 1000) и таблицы */

                /* Остальное по вашему усмотрению */
                border: none;
                cursor: pointer;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
            }

            #downloadCsvButton:hover {
                background-color: lightgreen; /* Цвет при наведении курсора */
            }

            td {
             padding: 10px;
             border: 1px solid #495057;
            }

            .td-inner {
                 overflow: hidden;
                 display: -webkit-box;
                 -webkit-line-clamp: 3;
                       line-clamp: 3;
                 -webkit-box-orient: vertical;
            }

            .popup-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
            }

            .popup-content {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #333;
                padding: 20px;
                border-radius: 10px;
                max-width: 80vw; /* Максимум 80% ширины экрана */
                z-index: 1001;
                color: #fff;
            }

            .popup-content textarea {
                width: 100%;
                height: 200px;
                margin-bottom: 20px;
                margin-top: 20px;

            }
            
            .popup-close {
                position: absolute;
                top: 0px;
                right: 0px;
                cursor: pointer;
                background: #ff0000;
                color: #fff;
                border: none;
                border-radius: 10px;
                width: 25px;
                height: 25px;
            }

            .popup-content .btn-primary {
                display: block;
                margin: 0 auto;
            }

            .mail-icon {
                cursor: pointer;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }

            .mail-icon img {
                width: 50px;
                height: 50px;
                margin-bottom: 5px;
            }

            .tab-pane:not(.active) .chart_wrap {
                display: none;
            }

            #notification {
                display: none; /* по умолчанию скрываем уведомление */
                position: fixed;
                top: 10px;
                width: 100%;
                text-align: center;
                z-index: 10000;
            }
            #notificationMessage {
                display: inline-block;
                padding: 10px 20px;
                border-radius: 5px;
                color: white;
                background-color: green; /* добавим фон по умолчанию */
                white-space: pre-line;
                position: relative;
                text-align: left; /* выравнивание текста по левому краю */
            }
            .close-btn {
                display: block; /* блоковый элемент для кнопки */
                width: 100%; /* на всю ширину родительского элемента */
                padding: 10px 0; /* вертикальные отступы */
                border: none;
                background-color: #555;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                text-align: center; /* выравнивание текста по центру */
            }
            .close-btn:hover {
                background-color: #777;
            }

            /* Add styles for text wrapping and copy functionality */
            .copyable-cell {
                white-space: normal;
                word-wrap: break-word;
                cursor: pointer;
                overflow-wrap: break-word;
            }

            .copyable-cell a {
                color: inherit;
                text-decoration: none;
            }

            .copyable-cell a:hover {
                background-color: #007bff; /* Highlight color on hover */
                color: white;
            }

            .td-inner {
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                line-clamp: 3;
                -webkit-box-orient: vertical;
            }

            .td-inner:hover {
                -webkit-line-clamp: inherit;
                line-clamp: inherit;
            }

            .radio-container {
                display: flex;
                flex-direction: column;
                align-items: flex-start; /* Выравнивание по левому краю внутри контейнера */
                margin: 0 auto; /* Центрирование контейнера по горизонтали */
                max-width: 250px; /* Максимальная ширина контейнера */
                padding: 10px; /* Внутренний отступ */
                background-color: #22222a; /* Цвет фона контейнера */
                border-radius: 10px; /* Скругленные углы */
            }

            .form-check {
                margin-bottom: 10px; /* Отступ между радиокнопками */
                display: flex;
                align-items: center;
            }

            .form-check-input {
                margin-right: 10px; /* Отступ между радиокнопкой и текстом */
            }

            .form-check-label {
                font-size: 14px; /* Размер шрифта */
                color: #ffffff; /* Цвет текста */
            }

            .dropdown-funnel, .dropdown-revfunnel {
                margin-bottom: 15px; /* Отступ снизу для лучшего вида */
            }

            .file-preview-item {
                display: inline-block;
                margin: 5px;
                position: relative;
            }
            .file-preview-item img {
                width: 50px;
                height: 50px;
                object-fit: cover;
            }
            .remove-file {
                position: absolute;
                top: -5px;
                right: -5px;
                background: red;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
            }
            .button-row {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            .button-row input, .button-row select {
                margin-right: 10px;
                flex: 1;
                max-width: 200px;
            }
            .remove-button {
                background: red;
                color: white;
                border: none;
                cursor: pointer;
            }
            #customUserIds, #customUserIdsGoto {
                height: auto; /* Let rows dictate height */
                min-height: 8em; /* Minimum for ~3 lines; adjust as needed */
                resize: vertical; /* Optional: allow vertical resize */
                box-sizing: border-box; /* Ensure padding/borders are included in height calc */
            }
            .popup-content h5 {
                text-align: center;
            }

        </style>


    </head>
    <body>

    <div id="loadingOverlay" style="display:none; position: fixed; z-index: 9999; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,.5);"></div>
    <div id="loadingModal" style="display:none; position: fixed; z-index: 10000; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px; text-align: center; background: #333; color: white; border-radius: 10px; width: 300px;">
        <div id="loadingSpinner" class="spinner-border text-light" role="status" style="margin-bottom: 15px;"></div>
        <div id="loadingMessage">Загрузка данных...</div>
        <div id="errorMessage" style="display:none; margin-bottom: 15px;"></div>
        <div id="loadingButtons" style="display:none;">
            <button id="retryButton" type="button" class="btn btn-primary" style="margin: 5px;">Повторить попытку</button>
            <button id="changeFilterButton" type="button" class="btn btn-secondary" style="margin: 5px;">Изменить фильтр</button>
        </div>
    </div>

    <!-- Всплывающее окно отправки персонального сообщения -->
    <div id="messagePopup" class="popup-overlay">
        <div class="popup-content">
            <button id="closePopupButton" class="popup-close">&times;</button>
            <textarea id="messageTextArea" placeholder="Введите ваше сообщение"></textarea>
            <!-- Поле для ручного ввода IDs (только для массовой рассылки) -->
            <div id="customIdsContainer" class="form-group" style="display: none;">
                <label for="customUserIds">Ручной ввод ID пользователей:</label>
                <textarea id="customUserIds" rows="3" placeholder="Введите ID пользователей вручную, разделяя запятой, пробелом или новой строкой. Если тут не указать ID пользователей, то рассылка будет произведена по тем пользователям, которые попали в таблицу при фильтрации!"></textarea>
            </div>
            <!-- Секция для прикрепления файлов -->
            <div class="form-group">
                <label for="attachFiles">Прикрепить изображения (до 10):</label>
                <input type="file" id="attachFiles" multiple accept="image/*" class="form-control">
                <div id="filePreview" style="margin-top: 10px;"></div> <!-- Для превью файлов -->
            </div>
            
            <!-- Секция для кнопок -->
            <div class="form-group">
                <button type="button" id="addButton" class="btn btn-secondary" style="display: block; margin: 0 auto;">Добавить кнопку</button>
                <div id="buttonsContainer" style="margin-top: 10px;"></div> <!-- Контейнер для рядов кнопок -->
            </div>
            
            <button id="sendMessageButton" class="btn btn-primary">Отправить</button>
        </div>
    </div>

    <!-- Всплывающее окно для истории бота -->
    <div id="funnelHistoryPopup" class="popup-overlay funnel-history-popup">
        <div class="popup-content">
            <button id="closeFunnelHistoryPopupButton" class="popup-close">&times;</button>
            <h5>История бота</h5>
            <table>
                <tbody id="funnelHistoryTableBody"></tbody>
            </table>
        </div>
    </div>

    <!-- Всплывающее окно для GotoFunnel -->
    <div id="gotoFunnelPopup" class="popup-overlay">
        <div class="popup-content">
            <button id="closeGotoFunnelPopupButton" class="popup-close">&times;</button>
            <h5>Перевод в этап воронки</h5>
            <div class="form-group">
                <label for="gotoDatetime">Дата и время уведомления (по МСК):</label>
                <input type="datetime-local" id="gotoDatetime" class="form-control">
            </div>
            <div class="form-group">
                <label for="gotoFunnelSelect">Этап воронки:</label>
                <select id="gotoFunnelSelect" class="form-control">
                    <!-- Опции заполнятся динамически -->
                </select>
            </div>
            <!-- Поле для ручного ввода IDs -->
            <div class="form-group">
                <label for="customUserIdsGoto">Ручной ввод ID пользователей:</label>
                <textarea id="customUserIdsGoto" rows="3" placeholder="Введите ID пользователей вручную, разделяя запятой, пробелом или новой строкой. Если тут не указать ID пользователей, то продвижение по воронке будет произведено по тем пользователям, которые попали в таблицу при фильтрации!"></textarea>
            </div>
            <button id="continueGotoFunnelButton" class="btn btn-primary">Продолжить</button>
        </div>
    </div>

    <div id="notification">
        <div id="notificationMessage">
            <!-- Сообщение уведомления будет вставлено сюда -->
        </div>
    </div>

    <div class="filter-panel">
        <!-- Форма для фильтрации -->
        <form id="filterForm">
            <div class="row">
                <div class="col">
                    <div class="form-group">
                        <label for="date_start">Начальная дата:</label>
                        <input type="date" name="date_start" class="form-control">
                        <div class="form-group">
                            <div class="dropdown">
                                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdowncampaign" data-toggle="dropdown" aria-expanded="false">
                                    campaign
                                </button>
                                <div class="dropdown-menu" aria-labelledby="dropdowncampaign">
                                </div>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownsource" data-toggle="dropdown" aria-expanded="false">
                                    source
                                </button>
                                <div class="dropdown-menu" aria-labelledby="dropdownsource">
                                </div>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownmedium" data-toggle="dropdown" aria-expanded="false">
                                    medium
                                </button>
                                <div class="dropdown-menu" aria-labelledby="dropdownmedium">
                                </div>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownterm" data-toggle="dropdown" aria-expanded="false">
                                    term
                                </button>
                                <div class="dropdown-menu" aria-labelledby="dropdownterm">
                                </div>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdowncontent" data-toggle="dropdown" aria-expanded="false">
                                    content
                                </button>
                                <div class="dropdown-menu" aria-labelledby="dropdowncontent">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 dropdown-funnel">
                                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownfunnel" data-toggle="dropdown" aria-expanded="false">
                                    Попал в этап воронки
                                </button>
                                <div class="dropdown-menu dropdownfunnel-menu" aria-labelledby="dropdownfunnel">
                                    <!-- Варианты выбора funnel -->
                                </div>

                                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownrevfunnel" data-toggle="dropdown" aria-expanded="false">
                                    Не попал в этап воронки
                                </button>
                                <div class="dropdown-menu dropdownrevfunnel-menu" aria-labelledby="dropdownrevfunnel">
                                    <!-- Варианты выбора funnel -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="form-group">
                        <label for="date_end">Конечная дата:</label>
                        <input type="date" name="date_end" class="form-control">
                        <div class="form-group">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" name="is_blocked" value="1">
                                <label class="form-check-label">Заблокировал бота</label>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" name="is_not_blocked" value="0">
                                <label class="form-check-label">Бот не заблокирован</label>
                            </div>
                        </div>
                    </div>
                </div>                
            </div>
            

            <div class="separator">
                <hr>
            </div>

            <div class="row">
                <div class="col">
                    <div class="form-group">
                        <label for="ph_reg_start">Дата регистрации (начало):</label>
                        <input type="date" name="ph_reg_start" class="form-control">
                        <div class="dropdown-groups">
                            <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdowngroups" data-toggle="dropdown" aria-expanded="false">
                                Группы
                            </button>
                            <div class="dropdown-menu dropdowngroups-menu" aria-labelledby="dropdowngroups">
                                <!-- Варианты выбора групп -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="form-group">
                        <label for="ph_reg_end">Дата регистрации (конец):</label>
                        <input type="date" name="ph_reg_end" class="form-control">
                    </div>
                </div>

                <div class="col">
                    <div class="form-group">
                        <label for="ph_last_activity_start">Последняя активность (начало):</label>
                        <input type="date" name="ph_last_activity_start" class="form-control">
                    </div>
                </div>
                <div class="col">
                    <div class="form-group">
                        <label for="ph_last_activity_end">Последняя активность (конец):</label>
                        <input type="date" name="ph_last_activity_end" class="form-control">
                    </div>
                </div>
            </div>

            <div id="pokerhub-dropdowns" style="margin-bottom: 20px;"></div>

            <div class="row">
                <div class="col text-center">
                    <div class="separator">
                        <hr>

                        <div class="radio-container">
                            <div class="form-check">
                                <input type="radio" class="form-check-input" name="user_type" value="ph_registered">
                                <label class="form-check-label">Только юзеры с регой на ПХ</label>
                            </div>
                            <div class="form-check">
                                <input type="radio" class="form-check-input" name="user_type" value="ph_not_registered">
                                <label class="form-check-label">Только юзеры без реги на ПХ</label>
                            </div>
                            <div class="form-check">
                                <input type="radio" class="form-check-input" name="user_type" value="all" checked>
                                <label class="form-check-label">Все юзеры</label>
                            </div>
                        </div>
                        <button type="button" class="btn btn-primary mt-2" onclick="applyFilter()">Применить фильтр</button>
                    </div>
                </div>
            </div>
        </form>
    </div>
    <div>
        <!-- вкладки -->
        <ul class="nav nav-pills flex-column flex-sm-row" id="Tab" role="tablist">
            <li class="nav-item">
                <a class="nav-link active" id="users-tab" data-toggle="tab" data-target="#users" role="tab" aria-controls="users" aria-selected="true">
                    Юзеры
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="general-tab" data-toggle="tab" data-target="#general" role="tab" aria-controls="general" aria-selected="false">
                    БОТ-UTM
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="ph-utm-tab" data-toggle="tab" data-target="#ph-utm" role="tab" aria-controls="ph-utm" aria-selected="false">
                    ПХ-UTM
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="graphs-tab" data-toggle="tab" data-target="#graphs" role="tab" aria-controls="graphs" aria-selected="false">
                    Графики
                </a>
            </li>
        </ul>

        <div class="tab-content" id="TabContent">
            <!-- Users tab -->
            <div class="tab-pane show active" id="users" role="tabpanel" aria-labelledby="users-tab">
                <!-- Таблица для отображения результатов -->
                <div class="table-responsive-sm">
                    <table class="table table-sm mt-4" id="main-users-table">
                        <thead>
                            <tr>
                                <th>№</th>
                                <th>
                                    <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                                        <button id="massMessageButton" type="button" class="btn btn-sm" style="width: 100%; background-color: #D19A37; color: #2A2A32;">Массовая рассылка</button>
                                    </div>
                                </th>
                                <th>Юзернейм</th>
                                <th>Имя</th>
                                <th>Фамилия</th>
                                <th>Регистрация</th>
                                <th>Заблокировал</th>
                                <th>BOT-UTM</th>
                                <th>BOT RAW</th>
                                <th>PH-UTM</th>
                                <th>PH RAW</th>
                                <th>Регистрация ПХ</th>
                                <th>Активность</th>
                                <th>Группы</th>
                                <th>Курсы</th>
                                <th>
                                    <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                                        <button class="btn btn-sm" style="width: 100%; background-color: #D19A37; color: #2A2A32; text-decoration: none;" onclick="showGotoFunnelPopup()">Продвинуть по воронке</button>
                                    </div>
                                </th>
                                <th>История бота</th>
                            </tr>
                        </thead>
                        <tbody id="dataBodyUsers">
                            <!-- Заполнится данными динамически -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- General -->
            <div class="tab-pane" id="general" role="tabpanel" aria-labelledby="general-tab">
                <table class="table mt-4">
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Метка</th>
                            <th>Количество</th>
                        </tr>
                    </thead>
                    <tbody id="dataBodyGeneral">
                        <!-- Data will be dynamically populated here -->
                    </tbody>
                </table>
            </div>

            <!-- PH-UTM -->
            <div class="tab-pane" id="ph-utm" role="tabpanel" aria-labelledby="ph-utm-tab">
                <table class="table mt-4">
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Метка</th>
                            <th>Количество</th>
                        </tr>
                    </thead>
                    <tbody id="dataPhUtmGeneral">
                        <!-- Data will be dynamically populated here -->
                    </tbody>
                </table>
            </div>

            <!-- Graphs -->
            <div class="tab-pane" id="graphs" role="tabpanel" aria-labelledby="graphs-tab">
                <div id="line_chart_container" class="chart_wrap"></div>
                <div id="circle_chart_container" class="chart_wrap"></div>
                <div id="bar_chart_container" class="chart_wrap"></div>
            </div>
        </div>
    </div>
    <div id="csvButtonContainer" class="text-center">
        <button id="downloadCsvButton" onclick="downloadTableAsCSV()">CSV</button>
    </div>
    </body>
        
    
    </html>
  `;



  return (
    <div dangerouslySetInnerHTML={{ __html: fullHtml }} />
  );
};


export default Index;