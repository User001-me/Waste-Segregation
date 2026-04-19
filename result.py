import pandas as pd
import matplotlib.pyplot as plt

# CSV load karo
df = pd.read_csv("results.csv")

print(df.columns)

# Plot
plt.figure(figsize=(10,6))

plt.plot(df['epoch'], df['train/box_loss'], label='Train Box Loss')
plt.plot(df['epoch'], df['val/box_loss'], label='Val Box Loss')

plt.plot(df['epoch'], df['train/cls_loss'], label='Train Cls Loss')
plt.plot(df['epoch'], df['val/cls_loss'], label='Val Cls Loss')

plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.title('YOLOv8 Loss Curve')
plt.legend()
plt.grid(True)

plt.show()