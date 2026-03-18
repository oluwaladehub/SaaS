import {useState, type ChangeEvent, type DragEvent, useRef, useEffect} from "react";
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS} from "../lib/constants";

interface UploadProps {
    onComplete?: (data: string) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { isSignedIn } = useOutletContext<AuthContext>()

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const validateFile = (file: File) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error("Invalid file type. Please upload a JPG or PNG image.");
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new Error("File is too large. Maximum size allowed is 10MB.");
        }
        return true;
    };

    const processFile = (file: File) => {
        if (!isSignedIn) return;

        setError(null);
        try {
            validateFile(file);
        } catch (err) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setFile(null);
            setProgress(0);
            setError(err instanceof Error ? err.message : "Validation failed");
            return;
        }

        setFile(file);
        setProgress(0);

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target?.result as string;

            intervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    const nextProgress = prev + PROGRESS_STEP;
                    if (nextProgress >= 100) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        timeoutRef.current = setTimeout(() => {
                            if (onComplete) onComplete(base64Data);
                            timeoutRef.current = null;
                        }, REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return nextProgress;
                });
            }, PROGRESS_INTERVAL_MS);
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (isSignedIn) setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isSignedIn) return;

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    return (
        <div className="upload">
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? "is-dragging" : ""}`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept=".jpg, .jpeg, .png"
                        className="drop-input"
                        disabled={!isSignedIn}
                        onChange={handleFileChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20} />
                        </div>
                        <p>
                            {isSignedIn ? (
                                "Click to upload or just drag and drop"
                            ) : ("Sign in or Sign up with Puter to upload")}
                        </p>
                        <p className="help">Maximum file size 10 MB.</p>
                        {error && <p className="error-text" style={{ color: '#ef4444', marginTop: '8px', fontSize: '14px' }}>{error}</p>}
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? (
                                <CheckCircle2 className="check" />
                            ) : (
                                <ImageIcon className="image" />
                            )}
                        </div>

                        <h3>{file.name}</h3>

                        <div className="progress">
                            <div className="bar" style={{ width: `${progress}%` }}/>

                            <p className="status-text">
                                {progress < 100 ? 'Analyzing Floor Plan...' : 'Redirecting...'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default Upload
