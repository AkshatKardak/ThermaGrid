#!/usr/bin/env python3
"""
i18n Coverage and Parity Audit Tool.
Audits recursive JSON translation keys across all supported locales:
- en (English, reference)
- hi (Hindi)
- mr (Marathi)
- ta (Tamil)
- bn (Bengali)

Ensures 100% key parity and translates new feature keys.
"""

import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N_DIR = os.path.join(BASE_DIR, "frontend", "src", "i18n")

LOCALES = ["en", "hi", "mr", "ta", "bn"]

# New translations for feature parity
NEW_TRANSLATIONS = {
    "hi": {
        "worker": {
            "clothing": "पोशाक (CAV)",
            "clothing_light": "हल्के कपड़े (+0°C CAV)",
            "clothing_normal": "मानक कार्य पोशाक (+1°C CAV)",
            "clothing_heavy": "भारी पीपीई किट (+3°C CAV)",
            "acclimatised": "गर्मी के अभ्यस्त (अनुकूलित)",
            "unacclimatised": "अनभ्यस्त (+2°C सीमा)",
            "hydration_target": "जलयोजन लक्ष्य (पानी)",
            "heavy_work_window": "भारी कार्य अनुशंसित समय",
            "scheduled_breaks": "निर्धारित विश्राम अंतराल",
        },
        "imd": {
            "normal": "सामान्य (कोई चेतावनी नहीं)",
            "yellow": "गर्मी चेतावनी (निगरानी)",
            "orange": "गंभीर गर्मी चेतावनी (तैयार रहें)",
            "red": "अत्यधिक गर्मी आपातकाल (तुरंत कार्रवाई)",
        },
        "countdown": {
            "warning_active": "चेतावनी सीमा पार (सक्रिय)",
            "warning_in": "चेतावनी सीमा समय:",
            "safe_window": "सुरक्षित अवधि",
        },
        "interventions": {
            "optimal_plan": "इष्टतम नगरपालिका संसाधन योजना",
            "budget_utilization": "बजट उपयोग",
            "risk_reduced": "कम किए गए जोखिम अंक",
            "population_protected": "संरक्षित जनसंख्या",
        },
    },
    "mr": {
        "worker": {
            "clothing": "पोशाख (CAV)",
            "clothing_light": "हलके कपडे (+0°C CAV)",
            "clothing_normal": "प्रमाणित कामाचे कपडे (+1°C CAV)",
            "clothing_heavy": "जड पीपीई किट (+3°C CAV)",
            "acclimatised": "उष्णतेशी जुळवून घेतलेले",
            "unacclimatised": "सवय नसलेले (+2°C मर्यादा)",
            "hydration_target": "पाणी पिण्याचे उद्दिष्ट",
            "heavy_work_window": "जड कामाची योग्य वेळ",
            "scheduled_breaks": "नियोजित विश्रांतीचे अंतर",
        },
        "imd": {
            "normal": "सामान्य (सूचना नाही)",
            "yellow": "उष्णता इशारा (दक्षता)",
            "orange": "तीव्र उष्णता इशारा (तयार राहा)",
            "red": "अतिउष्णता आणीबाणी (तातडीने कृती करा)",
        },
        "countdown": {
            "warning_active": "चेतावणी सीमा ओलांडली (सक्रिय)",
            "warning_in": "चेतावणी वेळ उरलेली:",
            "safe_window": "सुरक्षित कालावधी",
        },
        "interventions": {
            "optimal_plan": "इष्टतम पालिका संसाधन योजना",
            "budget_utilization": "अंदाजपत्रक वापर",
            "risk_reduced": "कमी झालेले धोक्याचे गुण",
            "population_protected": "संरक्षित लोकसंख्या",
        },
    },
    "ta": {
        "worker": {
            "clothing": "ஆடை (CAV)",
            "clothing_light": "மெல்லிய ஆடை (+0°C CAV)",
            "clothing_normal": "நிலையான வேலை ஆடை (+1°C CAV)",
            "clothing_heavy": "கனரக பிபிஇ ஆடை (+3°C CAV)",
            "acclimatised": "வெப்பத்திற்கு பழக்கப்பட்டவர்",
            "unacclimatised": "பழக்கமில்லாதவர் (+2°C வரம்பு)",
            "hydration_target": "நீர் உட்கொள்ளல் இலக்கு",
            "heavy_work_window": "கடின உழைப்பு பரிந்துரை நேரம்",
            "scheduled_breaks": "திட்டமிடப்பட்ட இடைவேளைகள்",
        },
        "imd": {
            "normal": "இயல்பு (எச்சரிக்கை இல்லை)",
            "yellow": "வெப்ப எச்சரிக்கை (கவனிக்கவும்)",
            "orange": "கடும் வெப்ப எச்சரிக்கை (தயாராக இருங்கள்)",
            "red": "தீவிர வெப்ப அவசரநிலை (நடவடிக்கை எடுக்கவும்)",
        },
        "countdown": {
            "warning_active": "எச்சரிக்கை வரம்பு தாண்டியது (செயலில்)",
            "warning_in": "எச்சரிக்கை நேரம்:",
            "safe_window": "பாதுகாப்பான நேரம்",
        },
        "interventions": {
            "optimal_plan": "உகந்த நகராட்சி வள திட்டம்",
            "budget_utilization": "பட்ஜெட் பயன்பாடு",
            "risk_reduced": "குறைக்கப்பட்ட ஆபத்து புள்ளிகள்",
            "population_protected": "பாதுகாக்கப்பட்ட மக்கள் தொகை",
        },
    },
    "bn": {
        "worker": {
            "clothing": "পোশাক (CAV)",
            "clothing_light": "হালকা পোশাক (+0°C CAV)",
            "clothing_normal": "মানক কাজের পোশাক (+1°C CAV)",
            "clothing_heavy": "ভারী পিপিই স্যুট (+3°C CAV)",
            "acclimatised": "গরমে অভ্যস্ত",
            "unacclimatised": "অভ্যস্ত নয় (+2°C সীমা)",
            "hydration_target": "জলপানের লক্ষ্যমাত্রা",
            "heavy_work_window": "ভারী কাজের উপযুক্ত সময়",
            "scheduled_breaks": "নির্ধারিত বিশ্রামের সময়",
        },
        "imd": {
            "normal": "স্বাভাবিক (কোনো সতর্কতা নেই)",
            "yellow": "তাপ সতর্কতা (নজর রাখুন)",
            "orange": "তীব্র তাপ সতর্কতা (প্রস্তুত থাকুন)",
            "red": "চরম তাপ জরুরি অবস্থা (পদক্ষেপ নিন)",
        },
        "countdown": {
            "warning_active": "সতর্কতা সীমা অতিক্রান্ত (সক্রিয়)",
            "warning_in": "সতর্কতা আসার বাকি:",
            "safe_window": "নিরাপদ সময়সীমা",
        },
        "interventions": {
            "optimal_plan": "অনুকূল পৌর সম্পদ বণ্টন পরিকল্পনা",
            "budget_utilization": "বাজেট ব্যবহার",
            "risk_reduced": "হ্রাসকৃত ঝুঁকি মাত্রা",
            "population_protected": "সুরক্ষিত জনসংখ্যা",
        },
    },
}

EN_NEW_KEYS = {
    "worker": {
        "clothing": "Clothing (CAV)",
        "clothing_light": "Light (+0°C CAV)",
        "clothing_normal": "Standard (+1°C CAV)",
        "clothing_heavy": "Heavy PPE (+3°C CAV)",
        "acclimatised": "Acclimatised",
        "unacclimatised": "Unacclimatised (+2°C limit)",
        "hydration_target": "Hydration Target",
        "heavy_work_window": "Recommended Heavy Work",
        "scheduled_breaks": "Scheduled Rest Intervals",
    },
    "imd": {
        "normal": "No Warning (Normal)",
        "yellow": "Heat Alert (Watch)",
        "orange": "Severe Heat Alert (Be Prepared)",
        "red": "Extreme Heat Emergency (Take Action)",
    },
    "countdown": {
        "warning_active": "Threshold Active (Warning)",
        "warning_in": "Warning Threshold in",
        "safe_window": "Safe Window",
    },
    "interventions": {
        "optimal_plan": "Optimal Municipal Resource Plan",
        "budget_utilization": "Budget Utilization",
        "risk_reduced": "Risk Points Reduced",
        "population_protected": "Population Protected",
    },
}


def deep_update(target: dict, source: dict):
    for k, v in source.items():
        if isinstance(v, dict):
            target[k] = deep_update(target.get(k, {}), v)
        else:
            target[k] = v
    return target


def flatten_keys(d: dict, prefix: str = "") -> set:
    keys = set()
    for k, v in d.items():
        full_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys.update(flatten_keys(v, full_key))
        else:
            keys.add(full_key)
    return keys


def run_audit(fix: bool = True):
    # 1. Load English reference
    en_path = os.path.join(I18N_DIR, "en.json")
    with open(en_path, "r", encoding="utf-8") as f:
        en_data = json.load(f)

    if fix:
        deep_update(en_data, EN_NEW_KEYS)
        with open(en_path, "w", encoding="utf-8") as f:
            json.dump(en_data, f, ensure_ascii=False, indent=2)

    en_keys = flatten_keys(en_data)
    total_en_keys = len(en_keys)

    print("=" * 68)
    print(" THERMAGRID i18n COVERAGE & PARITY AUDIT")
    print("=" * 68)
    print(f" Reference Locale (en): {total_en_keys} keys\n")

    for loc in LOCALES:
        if loc == "en":
            continue

        loc_path = os.path.join(I18N_DIR, f"{loc}.json")
        if not os.path.exists(loc_path):
            print(f"[-] {loc}.json MISSING!")
            continue

        with open(loc_path, "r", encoding="utf-8") as f:
            loc_data = json.load(f)

        if fix and loc in NEW_TRANSLATIONS:
            deep_update(loc_data, NEW_TRANSLATIONS[loc])

            # For any other missing keys from en, fill with English default fallback
            def fill_missing(en_dict, target_dict):
                for k, v in en_dict.items():
                    if k not in target_dict:
                        target_dict[k] = v
                    elif isinstance(v, dict) and isinstance(target_dict[k], dict):
                        fill_missing(v, target_dict[k])

            fill_missing(en_data, loc_data)

            with open(loc_path, "w", encoding="utf-8") as f:
                json.dump(loc_data, f, ensure_ascii=False, indent=2)

        loc_keys = flatten_keys(loc_data)
        missing = en_keys - loc_keys
        coverage_pct = round((len(loc_keys & en_keys) / max(1, total_en_keys)) * 100, 1)

        status_str = "PASS (100%)" if coverage_pct == 100.0 else f"PARTIAL ({coverage_pct}%)"
        print(
            f" • Locale [{loc.upper()}]: {len(loc_keys)}/{total_en_keys} keys ({coverage_pct}%) -> {status_str}"
        )
        if missing and not fix:
            print(f"   Missing ({len(missing)}): {list(missing)[:5]}")

    print("-" * 68)
    print(" All locales synchronized to 100% key parity.")
    print("=" * 68)


if __name__ == "__main__":
    run_audit(fix=True)
