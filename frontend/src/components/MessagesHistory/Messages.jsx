import React, {useEffect, useState} from "react";
import {create_socket, getAuthCookie} from "../../modules";
import Dialogue from "./Dialogue";
import axios from "axios";
import {apiUrl} from "../../config";
import Filters from "../MessagesHistory/Filters";

const Messages_history = () => {
    const [tickets, setTickets] = useState([]);
    const getFilter = JSON.parse(localStorage.getItem('dialogues_filter'));

    const [filter, setFilter] = useState(getFilter || {
        id: '',
        author_name: '',
        sort_by_new: true,
        limit: 50
    });

    function sortHandle(x, y) {
        const dateX = x.last_msg_time ? new Date(x.last_msg_time) : new Date(0); 
        const dateY = y.last_msg_time ? new Date(y.last_msg_time) : new Date(0);

        return filter.sort_by_new ? dateY - dateX : dateX - dateY;
    }

    function filterHandler(filter, ticket) {
        if (!ticket.id.toString().includes(filter.id)) return false;
        if (!ticket.author_name.toLowerCase().includes(filter.author_name.toLowerCase())) return false;
        return true;
    }

    if (!getFilter) {
        localStorage.setItem('dialogues_filter', JSON.stringify(filter));
    }

    const fetchTickets = async () => {
        try {
            const resp = await axios.get(apiUrl + '/messages_history/?filter=' + JSON.stringify(filter), getAuthCookie());
            setTickets(resp.data);
        } catch (error) {
            console.error("Error fetching msg's: ", error);
        }
    };

    useEffect(() => {
        localStorage.setItem('dialogues_filter', JSON.stringify(filter));
        fetchTickets();
    }, [filter]);

    useEffect(() => {
        const interval = setInterval(fetchTickets, 3000); // Запрос каждые 3 секунды
        return () => clearInterval(interval); // Очистка интервала при размонтировании компонента
    }, [filter]);

    return (
        <div>
            <button className="btn btn-outline-light my-3 px-5" type="button" data-bs-toggle="offcanvas"
                    data-bs-target="#ticketFilters" aria-controls="ticketFilters">Фильтры
            </button>
            <div className="table-responsive">
                <table className="table table-dark table-hover">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Никнейм</th>
                        <th scope="col">Последнее сообщение в чате</th>
                        <th scope="col">Последняя активность</th>
                    </tr>
                    </thead>
                    <tbody style={{cursor: 'pointer'}}>
                        {tickets.sort(sortHandle).map(obj => {
                            if (filterHandler(filter, obj)) {
                                return <Dialogue key={obj.id} dialogue={obj} />;
                            }
                        })}
                    </tbody>
                </table>
            </div>
            <Filters filter={filter} setFilter={setFilter} />
        </div>
    );
};

export default Messages_history;
