import React, { useRef } from 'react';
import { Box, Input } from '@chakra-ui/react';

interface VideoUploaderProps {
    onUpload: (file: File) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onUpload }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file size (500MB max)
            const maxSize = 500 * 1024 * 1024; // 500MB in bytes
            if (file.size > maxSize) {
                alert('Video file is too large. Maximum size is 500MB.');
                return;
            }

            // Validate file type
            const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
            if (!validTypes.includes(file.type)) {
                alert('Invalid video format. Please use MP4, WebM, or MOV.');
                return;
            }

            onUpload(file);
        }
    };

    const triggerFileInput = () => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    };

    return (
        <Box onClick={triggerFileInput}>
            <Input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoUpload}
                hidden
            />
        </Box>
    );
};

export default VideoUploader;
