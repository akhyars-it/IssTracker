import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import './App.css';

function App() {
  const globeEl = useRef();
  const [pos, setPos] = useState({ lat: 0, lng: 0 });
  const [path, setPath] = useState([]);
  const [locationName, setLocationName] = useState("Establishing Link...");
  const [crew, setCrew] = useState([]);

  const updateISS = async () => {
    try {
      const res = await fetch('http://api.open-notify.org/iss-now.json');
      const json = await res.json();
      const lat = parseFloat(json.iss_position.latitude);
      const lng = parseFloat(json.iss_position.longitude);
      
      setPos({ lat, lng });
      setPath(prev => [...prev, { lat, lng }]);

      const geoRes = await fetch(`https://api.bigdatacoloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`);
      const geoJson = await geoRes.json();
      setLocationName(geoJson.locality || geoJson.principalSubdivision || "Over the Ocean");
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    updateISS();
    const fetchCrew = async () => {
      const res = await fetch('http://api.open-notify.org/astros.json');
      const json = await res.json();
      setCrew(json.people.filter(p => p.craft === 'ISS'));
    };
    fetchCrew();
    const interval = setInterval(updateISS, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: pos.lat, lng: pos.lng, altitude: 2 }, 1000);
    }
  }, [pos]);

  const gData = [{ lat: pos.lat, lng: pos.lng }];

  return (
    <div className="App">
      <div className="hud">
        <div className="status-header">
          <div className="pulse"></div>
          <span>LIVE TELEMETRY</span>
        </div>
        <h1>ISS TRACKER</h1>
        <h2 className="city">{locationName}</h2>
        <div className="grid">
          <div className="box"><small>LATITUDE</small><p>{pos.lat.toFixed(4)}°</p></div>
          <div className="box"><small>LONGITUDE</small><p>{pos.lng.toFixed(4)}°</p></div>
        </div>
        <div className="crew">
          <h3>CREW MANIFEST ({crew.length})</h3>
          <ul>{crew.map((p, i) => <li key={i}>{p.name}</li>)}</ul>
        </div>
        <div className="footer">ORBITAL VELOCITY: 28,000 KM/H</div>
      </div>

      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pathsData={[path]}
        pathColor={() => '#00d2ff'}
        pathDashLength={0.1}
        pathDashGap={0.008}
        pathDashAnimateTime={12000}
        pathPointAlt={0.05} 
        htmlElementsData={gData}
        htmlElement={() => {
          const el = document.createElement('div');
          // Added 'filter: invert(1) brightness(2)' to make the icon white
          el.innerHTML = `
            <img 
              src="https://cdn-icons-png.flaticon.com/512/17143/17143607.png" 
              style="width: 50px; filter: invert(1) brightness(2); drop-shadow: 0 0 5px white;" 
            />`;
          return el;
        }}
      />
    </div>
  );
}

export default App;