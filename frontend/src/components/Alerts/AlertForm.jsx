import AlertSend from "./AlertSend";
import {useState} from "react";

const AlertForm = () => {
    const [status, setStatus] = useState(null)
    const Message = ({status}) => {
        if (status) {
            return (
                <>
                    <h4>Статус сообщения - {status.text}</h4>
                    <h4>Статус медиа - {status.media}</h4>
                    <h4>Статус фото - {status.photos}</h4>
                </>)
        }
    }
    return (
        <div className="mt-5">

           <Message status={status}/>
           <AlertSend setStatus={setStatus}/>

        </div>
    )
}
export default AlertForm;