"""Check if GPU is available"""
import torch

print("Checking GPU availability...")
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    print(f"GPU found: {torch.cuda.get_device_name(0)}")
    print(f"CUDA version: {torch.version.cuda}")
    print("Your models will use GPU acceleration!")
else:
    print("No GPU found. Models will run on CPU.")
    print("\nTo install PyTorch with CUDA support:")
    print("pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118")

