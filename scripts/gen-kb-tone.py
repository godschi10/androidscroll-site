"""Generate a 1s placeholder tone (44.1kHz 16-bit mono sine 440Hz)."""
import math
import struct
import wave

SR = 44100
DUR = 1.0
N = int(SR * DUR)
path = '/home/ubuntu/androidscroll/build/public/audio/kb-note.wav'
with wave.open(path, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    for i in range(N):
        env = min(1.0, i / (SR * 0.05), (N - i) / (SR * 0.1))
        v = int(12000 * env * math.sin(2 * math.pi * 440 * i / SR))
        w.writeframes(struct.pack('<h', v))
print('wrote', path)
