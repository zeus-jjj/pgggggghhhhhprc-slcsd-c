import {ticket_statuses} from "../../config";
import {useNavigate} from 'react-router-dom'

const Ticket = ({ticket}) => {
    const navigate = useNavigate()
    return (

        <tr onClick={() => {
            return navigate('/tickets/'+ticket.id)
        }}>
            <td>{ticket.id}</td>
            <td>{ticket.author_name}</td>
            <td>{ticket.text}</td>
            <td>{ticket_statuses[ticket.status]}</td>
            <td>{ticket.support_name}</td>
            <td>{ticket.last_msg_time}</td>
        </tr>
    )
}
export default Ticket