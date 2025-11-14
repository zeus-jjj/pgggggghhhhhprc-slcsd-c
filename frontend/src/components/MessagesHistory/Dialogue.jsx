import {ticket_statuses} from "../../config";
import {useNavigate} from 'react-router-dom'

const Dialogue = ({dialogue}) => {
    const navigate = useNavigate()
    return (

        <tr onClick={() => {
            return navigate('/msg_history/'+dialogue.chat_id)
        }}>
            <td>{dialogue.id}</td>
            <td>{dialogue.author_name}</td>
            <td>{dialogue.content}</td>
            <td>{dialogue.last_msg_time}</td>
        </tr>
    )
}
export default Dialogue