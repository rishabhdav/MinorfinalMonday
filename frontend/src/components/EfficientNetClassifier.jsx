import PredictionDashboard from './PredictionDashboard';

function EfficientNetClassifier() {
  return (
    <PredictionDashboard
      modelKey="efficientnet"
      modelName="EfficientNet Classifier"
      title="EfficientNet Analysis"
      description="EfficientNet-based retinal image analysis using the unified backend prediction endpoint."
      accent="amber"
    />
  );
}

export default EfficientNetClassifier;
