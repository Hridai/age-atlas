import pandas as pd

historical_data = {  # for illustrative purposes now
    "2,000 BC - 0": {
        "World": {
            "Geography & Environment": "The agricultural revolution allowed the human population grow from 5-8 million foragers globally, to 250 million farmers by 1st century AD. Settled societies, cities, and states emerged, with the first empires in Mesopotamia, Egypt, India, and China. Writing, money, and religion developed, and the first major religions emerged."
        },
        "Mesopotamia": {
            "Governance & Society": "2,000 BC: Sumerians in Mesopotamia developed cuneiform writing, the first known writing system. The Epic of Gilgamesh, the oldest known work of literature, was written in 2,100 BC. Hammurabi's Code in Babylon introduced a legal system reinforcing social hierarchy.",
            "Culture & Religion": "2,000 BC: Sumerians in Mesopotamia developed cuneiform writing, the first known writing system. The Epic of Gilgamesh, the oldest known work of literature, was written in 2,100 BC."
        },
        "EGY": {
            "Science, Technology & Innovation": "2,000 BC: Egyptians developed hieroglyphics, the first writing system in Africa. The Great Pyramid of Giza was built in 2,560 BC."
        },
    },
}

def dict_to_csv(historical_data):
    rows = []
    
    for date, date_data in historical_data.items():
        for country, country_data in date_data.items():
            if isinstance(country_data, dict):  # Skip the 'order' key
                for theme, event in country_data.items():
                    rows.append({
                        'Date': date,
                        'Country': country,
                        'Theme': theme,
                        'Event': event
                    })
    
    df = pd.DataFrame(rows)
    df.to_csv('data/historical_events.csv', index=False)
    return df

dict_to_csv(historical_data)
