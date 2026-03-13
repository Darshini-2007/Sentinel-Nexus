import json, random, time
from pathlib import Path

# Mock live feeds from NASA/NOAA/USGS and sensors
rng = random.Random(time.time())

data = {
    "telemetry": {
        "uptime": round(99 + rng.random(), 2),
        "latency": rng.randint(5, 18),
        "qps": rng.randint(40, 120),
        "reports": rng.randint(120, 360)
    },
    "early_warning": {
        "state": rng.choice(["Monitoring", "Heads-up", "Watch issued"]),
        "seconds": rng.randint(20, 60),
        "signals": rng.choice([
            "FIRMS hotspot + river rise",
            "GPM rain surge + NOAA gusts",
            "ShakeMap micro tremors"
        ])
    },
    "hazard": rng.choice(["flood", "wildfire", "cyclone", "quake"])
}

out = Path("data/feeds.json")
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(data, indent=2))
print(f"wrote {out.resolve()}")
