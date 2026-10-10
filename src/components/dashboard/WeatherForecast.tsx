import { useEffect, useState } from "react";

type WeatherDay = {
  day: string;
  max: number;
  min: number;
  weatherCode: number;
};

type Province = {
  name: string;
  latitude: number;
  longitude: number;
};

const provinces: Province[] = [
  {
    name: "Almería",
    latitude: 36.834,
    longitude: -2.4637,
  },
  {
    name: "Cádiz",
    latitude: 36.5271,
    longitude: -6.2886,
  },
  {
    name: "Córdoba",
    latitude: 37.8882,
    longitude: -4.7794,
  },
  {
    name: "Granada",
    latitude: 37.1773,
    longitude: -3.5986,
  },
  {
    name: "Huelva",
    latitude: 37.2614,
    longitude: -6.9447,
  },
  {
    name: "Jaén",
    latitude: 37.7796,
    longitude: -3.7849,
  },
  {
    name: "Málaga",
    latitude: 36.7213,
    longitude: -4.4214,
  },
  {
    name: "Sevilla",
    latitude: 37.3891,
    longitude: -5.9845,
  },
];

function WeatherForecast() {
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState<Province>(
    provinces.find((province) => province.name === "Granada")!
  );

  useEffect(() => {
    const getWeather = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${selectedProvince.latitude}&longitude=${selectedProvince.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FMadrid&forecast_days=7`
        );

        const data = await response.json();

        const formattedData: WeatherDay[] = data.daily.time.map(
          (date: string, index: number) => ({
            day: new Date(date).toLocaleDateString("es-ES", {
              weekday: "short",
            }),
            max: Math.round(data.daily.temperature_2m_max[index]),
            min: Math.round(data.daily.temperature_2m_min[index]),
            weatherCode: data.daily.weather_code[index],
          })
        );

        setWeatherData(formattedData);
      } catch (error) {
        console.error("Error al obtener el tiempo:", error);
      } finally {
        setLoading(false);
      }
    };

    getWeather();
  }, [selectedProvince]);

  const getWeatherIcon = (code: number) => {
    if (code === 0) {
      return "☀️";
    }

    if ([1, 2].includes(code)) {
      return "🌤️";
    }

    if (code === 3) {
      return "☁️";
    }

    if ([45, 48].includes(code)) {
      return "🌫️";
    }

    if ([51, 53, 55, 61, 63, 65].includes(code)) {
      return "🌧️";
    }

    if ([71, 73, 75].includes(code)) {
      return "❄️";
    }

    if ([80, 81, 82].includes(code)) {
      return "🌦️";
    }

    if ([95, 96, 99].includes(code)) {
      return "⛈️";
    }

    return "🌤️";
  };

  return (
    <div className="weather-card">
      <div className="weather-header">
        <h3>Pronóstico del tiempo en</h3>

        <div className="weather-dropdown">
          <button
            type="button"
            className="weather-dropdown-button"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedProvince.name}

            <span
              className={`weather-dropdown-arrow ${
                isOpen ? "open" : ""
              }`}
            >
              ⌄
            </span>
          </button>

          <div
            className={`weather-dropdown-menu ${
              isOpen ? "open" : ""
            }`}
          >
            {provinces.map((province) => (
              <button
                type="button"
                key={province.name}
                className="weather-dropdown-option"
                onClick={() => {
                  setSelectedProvince(province);
                  setIsOpen(false);
                }}
              >
                {province.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="weather-days">
          {weatherData.map((weather, index) => (
            <div
              className="weather-day"
              key={`${weather.day}-${index}`}
            >
              <span className="weather-day-name">
                {weather.day}
              </span>

              <span className="weather-icon">
                {getWeatherIcon(weather.weatherCode)}
              </span>

              <span className="weather-max">
                {weather.max}°
              </span>

              <span className="weather-min">
                {weather.min}°
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WeatherForecast;