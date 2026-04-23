from __future__ import annotations

import math
import os
import struct
import wave

SAMPLE_RATE = 11025
DURATION_SECONDS = 64
AMPLITUDE = 0.34
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "audio")

NOTE_OFFSETS = {
    "C": 0,
    "D": 2,
    "E": 4,
    "F": 5,
    "G": 7,
    "A": 9,
    "B": 11,
}


TRACKS = [
    {
        "filename": "lullaby-01.wav",
        "title": "星月摇篮",
        "subtitle": "Moonlit Cradle",
        "tempo": 80,
        "key": "C",
        "octave": 4,
        "motif": ["C", "E", "G", "E", "D", "F", "A", "F"],
        "bass": ["C", "A", "F", "G"],
    },
    {
        "filename": "lullaby-02.wav",
        "title": "云朵晚安",
        "subtitle": "Cloud Goodnight",
        "tempo": 76,
        "key": "D",
        "octave": 4,
        "motif": ["D", "F", "A", "F", "E", "G", "B", "G"],
        "bass": ["D", "B", "G", "A"],
    },
    {
        "filename": "lullaby-03.wav",
        "title": "柔风夜曲",
        "subtitle": "Breeze Nocturne",
        "tempo": 72,
        "key": "E",
        "octave": 4,
        "motif": ["E", "G", "B", "G", "F", "A", "C", "A"],
        "bass": ["E", "C", "A", "B"],
    },
    {
        "filename": "lullaby-04.wav",
        "title": "海盐梦境",
        "subtitle": "Saltwater Dream",
        "tempo": 82,
        "key": "G",
        "octave": 4,
        "motif": ["G", "B", "D", "B", "A", "C", "E", "C"],
        "bass": ["G", "E", "C", "D"],
    },
    {
        "filename": "lullaby-05.wav",
        "title": "晨光呢喃",
        "subtitle": "Dawn Whisper",
        "tempo": 78,
        "key": "A",
        "octave": 4,
        "motif": ["A", "C", "E", "C", "G", "B", "D", "B"],
        "bass": ["A", "F", "D", "E"],
    },
    {
        "filename": "lullaby-06.wav",
        "title": "小熊午梦",
        "subtitle": "Bear Nap Waltz",
        "tempo": 74,
        "key": "F",
        "octave": 4,
        "motif": ["F", "A", "C", "A", "G", "B", "D", "B"],
        "bass": ["F", "D", "B", "C"],
    },
    {
        "filename": "lullaby-07.wav",
        "title": "枕边星河",
        "subtitle": "Pillow Starlight",
        "tempo": 70,
        "key": "C",
        "octave": 5,
        "motif": ["C", "G", "E", "D", "C", "A", "F", "G"],
        "bass": ["C", "A", "F", "G"],
    },
    {
        "filename": "lullaby-08.wav",
        "title": "梦里花园",
        "subtitle": "Garden In Dreams",
        "tempo": 79,
        "key": "D",
        "octave": 5,
        "motif": ["D", "A", "F", "E", "D", "B", "G", "A"],
        "bass": ["D", "B", "G", "A"],
    },
    {
        "filename": "lullaby-09.wav",
        "title": "雪夜轻吻",
        "subtitle": "Snowy Kiss",
        "tempo": 68,
        "key": "E",
        "octave": 5,
        "motif": ["E", "B", "G", "F", "E", "C", "A", "B"],
        "bass": ["E", "C", "A", "B"],
    },
    {
        "filename": "lullaby-10.wav",
        "title": "银河慢摇",
        "subtitle": "Galaxy Sway",
        "tempo": 77,
        "key": "G",
        "octave": 5,
        "motif": ["G", "D", "B", "A", "G", "E", "C", "D"],
        "bass": ["G", "E", "C", "D"],
    },
]


def note_frequency(name: str, octave: int) -> float:
    midi = NOTE_OFFSETS[name] + (octave + 1) * 12
    return 440.0 * (2 ** ((midi - 69) / 12))


def envelope(progress: float) -> float:
    attack = min(1.0, progress / 0.08)
    release = min(1.0, max(0.0, (1.0 - progress) / 0.25))
    return attack * (release ** 0.7)


def synth_note(samples: list[float], start_time: float, duration: float, frequency: float, amplitude: float) -> None:
    start = int(start_time * SAMPLE_RATE)
    end = min(len(samples), int((start_time + duration) * SAMPLE_RATE))

    for index in range(start, end):
        t = index / SAMPLE_RATE
        progress = (index - start) / max(1, end - start)
        env = envelope(progress)
        vibrato = math.sin(2 * math.pi * 4.7 * t) * 0.0025
        fundamental = math.sin(2 * math.pi * frequency * (t + vibrato))
        overtone = math.sin(2 * math.pi * frequency * 2 * (t + vibrato * 0.5)) * 0.24
        shimmer = math.sin(2 * math.pi * frequency * 3 * t) * 0.08
        samples[index] += (fundamental + overtone + shimmer) * amplitude * env


def synth_pad(samples: list[float], start_time: float, duration: float, frequency: float, amplitude: float) -> None:
    start = int(start_time * SAMPLE_RATE)
    end = min(len(samples), int((start_time + duration) * SAMPLE_RATE))

    for index in range(start, end):
        t = index / SAMPLE_RATE
        progress = (index - start) / max(1, end - start)
        env = min(1.0, progress / 0.18) * min(1.0, max(0.0, (1.0 - progress) / 0.3))
        slow = math.sin(2 * math.pi * frequency * t)
        airy = math.sin(2 * math.pi * frequency * 0.5 * t) * 0.45
        samples[index] += (slow * 0.55 + airy * 0.45) * amplitude * env


def build_track(track: dict[str, object]) -> list[float]:
    total_samples = SAMPLE_RATE * DURATION_SECONDS
    samples = [0.0] * total_samples
    beat = 60.0 / int(track["tempo"])
    motif = list(track["motif"])
    bass = list(track["bass"])
    octave = int(track["octave"])

    time_cursor = 0.0
    motif_index = 0
    bass_index = 0

    while time_cursor < DURATION_SECONDS:
        note_name = motif[motif_index % len(motif)]
        bass_name = bass[bass_index % len(bass)]
        lead_frequency = note_frequency(note_name, octave)
        harmony_frequency = note_frequency(note_name, max(3, octave - 1))
        bass_frequency = note_frequency(bass_name, max(2, octave - 2))

        synth_note(samples, time_cursor, beat * 0.88, lead_frequency, AMPLITUDE * 0.75)
        synth_note(samples, time_cursor + beat * 0.18, beat * 0.62, harmony_frequency, AMPLITUDE * 0.22)
        synth_pad(samples, time_cursor, beat * 2.2, bass_frequency, AMPLITUDE * 0.2)

        if motif_index % 4 == 3:
            accent_frequency = note_frequency(motif[(motif_index + 1) % len(motif)], octave + 1)
            synth_note(samples, time_cursor + beat * 0.52, beat * 0.48, accent_frequency, AMPLITUDE * 0.16)
            bass_index += 1

        motif_index += 1
        time_cursor += beat

    max_sample = max(max(samples), abs(min(samples)), 1.0)
    return [max(-1.0, min(1.0, sample / max_sample * 0.92)) for sample in samples]


def write_wav(filename: str, samples: list[float]) -> None:
    output_path = os.path.join(OUTPUT_DIR, filename)
    with wave.open(output_path, "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)

        frames = bytearray()
        for sample in samples:
            frames.extend(struct.pack("<h", int(sample * 32767)))
        wav_file.writeframes(frames)


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for track in TRACKS:
        samples = build_track(track)
        write_wav(str(track["filename"]), samples)
        print(f"generated {track['filename']}")


if __name__ == "__main__":
    main()
