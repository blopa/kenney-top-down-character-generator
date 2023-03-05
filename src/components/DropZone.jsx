import { useDropzone } from 'react-dropzone';
import { Typography, Box } from '@mui/material';

// Styles
import styles from './Dropzone.module.css';

export default function Dropzone({ onDrop }) {
    const {
        getRootProps,
        getInputProps,
        isFocused,
        isDragAccept,
        isDragReject,
        isDragActive,
        acceptedFiles,
        fileRejections,
    } = useDropzone({ accept: { 'image/*': [] }, onDrop });

    return (
        <Box
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...getRootProps()}
            className={`${styles.dropzone} ${isDragActive ? styles.active : ''} ${
                isDragReject ? styles.reject : ''
            }`}
        >
            <input
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...getInputProps()}
            />
            <Typography variant="subtitle1" gutterBottom>
                Drag 'n' drop some files here, or click to select files
            </Typography>
        </Box>
    );
}
