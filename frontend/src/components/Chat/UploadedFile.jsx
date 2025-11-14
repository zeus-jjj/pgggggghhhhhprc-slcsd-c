import {ReactComponent as X} from "../../icons/x-lg.svg";

const UploadedFile = ({file, setMessage}) => {

    function removeFile () {
        setMessage(msg => {
            return {
                ...msg,
                files:msg.files.filter(obj => obj !== file)
            }
        })
    }

    let Icon
    if (file.type.startsWith('image')) {
        Icon = require('../../icons/image.svg').ReactComponent
    } else if (file.type.endsWith('/pdf')) {
        Icon = require('../../icons/pdf.svg').ReactComponent
    } else if (file.type.endsWith('.sheet')) {
        Icon = require('../../icons/xlsx.svg').ReactComponent
    } else if (file.type.endsWith('.document')) {
        Icon = require('../../icons/text.svg').ReactComponent
    } else {
        Icon = require('../../icons/zip.svg').ReactComponent
    }
    return (
        <div className={'card m-2 p-2 w-50'} style={{minWidth:'250px'}}>
            <div className={'d-flex justify-content-between'}>
            <div>
                <Icon/>
                {file.name.length > 17 ? file.name.slice(0,6) + '...' + file.name.slice(-8) : file.name}
            </div>
            <div>
                <button className={'btn btn-outline-danger'} onClick={removeFile}><X/></button>
            </div>
            </div>
        </div>
    )
}
export default UploadedFile