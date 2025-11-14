import AlertSend from "./AlertSend";
import {useState} from "react";

const AlertForm = ({target}) => {
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
        <div className="modal fade modal-xl" id="AlertModal" aria-hidden="true" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Уведомление для {target.first_name} {target.last_name}</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <Message status={status}/>
                        <AlertSend target={target} setStatus={setStatus}/>
                    </div>

                </div>
            </div>
        </div>
    )
}
export default AlertForm;