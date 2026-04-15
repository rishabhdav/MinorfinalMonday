import PredictionDashboard from './PredictionDashboard';

function ResNetClassifier() {
  return (
    <PredictionDashboard
      modelKey="resnet"
      modelName="ResNet Classifier"
      title="ResNet Analysis"
      description="Residual network classification aligned with the backend prediction and history APIs."
      accent="green"
    />
  );
}

export default ResNetClassifier;
