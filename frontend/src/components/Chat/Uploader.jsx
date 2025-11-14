import UploadedFile from "./UploadedFile";

const Uploader = ({files, setMessage}) => {
    return (
        <div className={'d-flex'} style={{overflowX:'auto'}}>
            {files?.map((file, index) => <UploadedFile setMessage={setMessage} key={index} file={file}/>)}
        </div>
    )
}
export default Uploader