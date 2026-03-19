import {useLocation, useNavigate, useParams} from "react-router";
import {useCallback, useEffect, useRef, useState} from "react";
import {generate3DView, getProject} from "../../lib/ai.action";
import {Box, Download, RefreshCcw, Share2, X, AlertCircle} from "lucide-react";
import Button from "../../components/ui/Button";

const VisualizerId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { initialImage: stateInitialImage, initialRender: stateInitialRender, name } = location.state || {};

    const [initialImage, setInitialImage] = useState<string | undefined>(stateInitialImage);
    const [initialRender, setInitialRender] = useState<string | null | undefined>(stateInitialRender);
    const [projectName, setProjectName] = useState<string>(name || 'Untitled Project');

    const hasInitialGenerated = useRef(false);

    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBack = () => navigate('/');

    const runGeneration = useCallback(async (imageToProcess: string) => {
        if(!imageToProcess) return;

        try {
            setIsProcessing(true);
            setError(null);
            const result = await generate3DView({ sourceImage: imageToProcess });

            if(result.renderedImage) {
                setCurrentImage(result.renderedImage);
            }
        } catch (error: any) {
            console.error('Failed to generate 3D view:', error);
            setError(error.message || 'Failed to generate 3D view. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    useEffect(() => {
        const loadProject = async () => {
            if (stateInitialImage) {
                setInitialImage(stateInitialImage);
                setInitialRender(stateInitialRender);
                if (stateInitialRender) setCurrentImage(stateInitialRender);
                return;
            }

            if (id) {
                const project = await getProject(id);
                if (project) {
                    setInitialImage(project.sourceImage);
                    setInitialRender(project.renderedImage);
                    if (project.renderedImage) setCurrentImage(project.renderedImage);
                    if (project.name) setProjectName(project.name);
                } else {
                    navigate('/');
                }
            } else {
                navigate('/');
            }
        };

        loadProject();
    }, [id, stateInitialImage, stateInitialRender, navigate]);

    useEffect(() => {
        if(!initialImage || hasInitialGenerated.current) return;

        if(initialRender) {
            setCurrentImage(initialRender);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        runGeneration(initialImage);
    }, [initialImage, initialRender, runGeneration]);

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo"/>

                    <span className="name">
                        Roomify
                    </span>
                </div>
                <Button onClick={handleBack} variant="ghost" size="sm" className="exit">
                    <X className="icon" /> Exit Editor
                </Button>
            </nav>

            <section className="content">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{projectName}</h2>
                            <p className="note">Created by You</p>
                        </div>

                        <div className="panel-actions">
                            <Button
                                onClick={() => {}}
                                size="sm" className="export"
                                disabled={!currentImage}>
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                            <Button size='sm'
                                    onClick={() => {}}
                                    className="share" >
                                <Share2 className="w-4 h-4 mr-2" /> Share
                            </Button>
                        </div>
                    </div>

                    <div className={`render-area ${isProcessing ? 'processing' : ''}`}>
                        {error && (
                            <div className="error-banner">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                <span>{error}</span>
                            </div>
                        )}
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render" className="render-img" />
                        ) : (
                            <div className="render-placeholder">
                                {initialImage && (
                                    <img src={initialImage} alt="Original" className="render-fallback" />
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner" />
                                    <span className="title">Rendering...</span>
                                    <span className="subtitle">Generating your 3D visualisation</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}
export default VisualizerId
