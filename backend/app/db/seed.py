"""
Database seeding script.
Populates:
1. Canonical urban wards with demographic, built-environment, and GeoJSON boundary attributes.
2. Official Data Sources with complete provenance and licensing details.
3. Designated Municipal Cooling Shelters and Hydration Hubs.
4. Default Risk Configuration parameters.
5. Active early-warning advisory alerts.
6. Seed users (citizen, worker, authority).
"""

import logging
from sqlalchemy.orm import Session
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.location import Location
from app.models.cooling_centre import CoolingCentre
from app.models.data_source import DataSource
from app.models.risk import RiskConfig
from app.models.alert import Alert
from app.models.user import User
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)


def seed_database():
    print("Creating all database tables if not present...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # 1. Seed Data Sources (Provenance)
        if db.query(DataSource).count() == 0:
            print("Seeding Data Sources provenance registry...")
            sources = [
                DataSource(
                    name="Open-Meteo Global Weather API",
                    provider="Open-Meteo GmbH (ECMWF & GFS Seamless Model Integration)",
                    url="https://open-meteo.com",
                    spatial_resolution="1.0 km - 11.0 km (interpolated point-downscaled)",
                    temporal_resolution="Hourly",
                    date_range="1940 - Present + 7-Day Forecast",
                    license="Creative Commons Attribution 4.0 International (CC BY 4.0)",
                    variables="2m Temperature, Relative Humidity, 10m Wind Speed, Direct Solar Irradiance, Apparent Temperature",
                    update_frequency="Hourly",
                    description="Primary operational surface meteorological feed providing real-time conditions and 7-day numerical weather predictions.",
                ),
                DataSource(
                    name="IMD Automatic Weather Station (AWS) Network",
                    provider="India Meteorological Department (Govt. of India)",
                    url="https://mausam.imd.gov.in",
                    spatial_resolution="Station Point Observations",
                    temporal_resolution="15-minute / Hourly",
                    date_range="1980 - Present",
                    license="Government Open Data License - India (GODL)",
                    variables="Dry-bulb Temperature, Maximum Temperature, Relative Humidity, Wind Velocity, Heatwave Alerts",
                    update_frequency="Real-time (15 min)",
                    description="Official reference ground-truth meteorological monitoring network for climatological heatwave criteria verification.",
                ),
                DataSource(
                    name="Census of India & Socio-Economic Registry",
                    provider="Office of the Registrar General & Census Commissioner, Ministry of Home Affairs",
                    url="https://censusindia.gov.in",
                    spatial_resolution="Ward / Sub-District Level",
                    temporal_resolution="Decennial with NFHS-5 municipal population projections",
                    date_range="2011 - 2024 Projections",
                    license="Open Government Data (OGD) Platform India",
                    variables="Total Population, Age Demographics (>=65 and <=5 years), Slum Population Fraction, Outdoor Informal Laborers",
                    update_frequency="Annual projection adjustments",
                    description="Authoritative demographic exposure and vulnerability baseline for municipal ward-level risk mapping.",
                ),
                DataSource(
                    name="ISRO Bhuvan High-Resolution Land Use & Land Cover",
                    provider="National Remote Sensing Centre (NRSC) / ISRO",
                    url="https://bhuvan.nrsc.gov.in",
                    spatial_resolution="5.0 m (LISS-IV / Cartosat multispectral)",
                    temporal_resolution="Seasonal / Annual",
                    date_range="2018 - 2024",
                    license="ISRO Bhuvan Open Access License",
                    variables="Normalized Difference Vegetation Index (NDVI), Impervious Surface Fraction, Urban Canopy Cover, Water Bodies",
                    update_frequency="Bi-annual",
                    description="High-resolution multispectral remote sensing data for Urban Heat Island (UHI) intensity and vegetative deficit modeling.",
                ),
                DataSource(
                    name="OpenStreetMap Urban Infrastructure & Road Geometry",
                    provider="OpenStreetMap Foundation Contributors",
                    url="https://www.openstreetmap.org",
                    spatial_resolution="Vector Building Footprints & Road Centrelines",
                    temporal_resolution="Dynamic Continuous Updates",
                    date_range="2004 - Present",
                    license="Open Data Commons Open Database License (ODbL)",
                    variables="Administrative Ward Boundaries, Hospitals, Primary Health Centres, Transit Hubs, Community Halls",
                    update_frequency="Daily community synchronization",
                    description="Geospatial base layer providing ward polygons, healthcare facilities, and cooling shelter locations.",
                ),
            ]
            db.add_all(sources)
            db.commit()

        # 2. Seed Wards
        if db.query(Location).count() == 0:
            print("Seeding Metropolitan Wards (Mumbai & Delhi)...")
            wards = [
                Location(
                    state="Maharashtra",
                    district="Mumbai Suburban",
                    city="Mumbai",
                    ward_code="WARD_ME",
                    ward_name="Ward M/East (Govandi / Shivaji Nagar)",
                    latitude=19.0558,
                    longitude=72.9315,
                    area_sq_km=14.5,
                    population=807720,
                    population_density_per_km2=55705.0,
                    outdoor_worker_ratio=0.42,
                    informal_settlement_ratio=0.68,
                    tree_canopy_fraction=0.04,
                    elderly_ratio=0.065,
                    children_ratio=0.098,
                    cooling_access_deficit=0.75,
                    hospital_count=3,
                    drinking_water_deficit=0.58,
                    description="High-vulnerability urban ward. Features dense tin-roof informal settlements near Deonar, extreme canopy deficit, and heavy outdoor informal workforce.",
                    geometry_geojson={
                        "type": "Polygon",
                        "coordinates": [[
                            [72.915, 19.040], [72.945, 19.040],
                            [72.950, 19.070], [72.920, 19.070],
                            [72.915, 19.040]
                        ]]
                    }
                ),
                Location(
                    state="Maharashtra",
                    district="Mumbai City",
                    city="Mumbai",
                    ward_code="WARD_A",
                    ward_name="Ward A (Colaba / Fort / Marine Drive)",
                    latitude=18.9220,
                    longitude=72.8347,
                    area_sq_km=12.5,
                    population=185120,
                    population_density_per_km2=14810.0,
                    outdoor_worker_ratio=0.16,
                    informal_settlement_ratio=0.08,
                    tree_canopy_fraction=0.32,
                    elderly_ratio=0.115,
                    children_ratio=0.052,
                    cooling_access_deficit=0.22,
                    hospital_count=8,
                    drinking_water_deficit=0.12,
                    description="Low-vulnerability coastal ward. Benefited by maritime breezes, heritage stone masonry, high mature tree canopy cover, and affluent infrastructure.",
                    geometry_geojson={
                        "type": "Polygon",
                        "coordinates": [[
                            [72.820, 18.905], [72.845, 18.905],
                            [72.845, 18.940], [72.820, 18.940],
                            [72.820, 18.905]
                        ]]
                    }
                ),
                Location(
                    state="Maharashtra",
                    district="Mumbai Suburban",
                    city="Mumbai",
                    ward_code="WARD_HE",
                    ward_name="Ward H/East (Bandra East / Khar)",
                    latitude=19.0607,
                    longitude=72.8536,
                    area_sq_km=13.5,
                    population=557233,
                    population_density_per_km2=41276.0,
                    outdoor_worker_ratio=0.34,
                    informal_settlement_ratio=0.54,
                    tree_canopy_fraction=0.09,
                    elderly_ratio=0.075,
                    children_ratio=0.082,
                    cooling_access_deficit=0.62,
                    hospital_count=5,
                    drinking_water_deficit=0.45,
                    description="Mixed density ward with transit bottlenecks (Bandra Terminus), asphalt corridors, and railway-adjacent informal settlements.",
                    geometry_geojson={
                        "type": "Polygon",
                        "coordinates": [[
                            [72.840, 19.050], [72.870, 19.050],
                            [72.870, 19.080], [72.840, 19.080],
                            [72.840, 19.050]
                        ]]
                    }
                ),
                Location(
                    state="Maharashtra",
                    district="Mumbai Suburban",
                    city="Mumbai",
                    ward_code="WARD_KW",
                    ward_name="Ward K/West (Andheri West / Juhu / Versova)",
                    latitude=19.1197,
                    longitude=72.8468,
                    area_sq_km=23.4,
                    population=749360,
                    population_density_per_km2=32024.0,
                    outdoor_worker_ratio=0.24,
                    informal_settlement_ratio=0.30,
                    tree_canopy_fraction=0.18,
                    elderly_ratio=0.090,
                    children_ratio=0.065,
                    cooling_access_deficit=0.38,
                    hospital_count=11,
                    drinking_water_deficit=0.25,
                    description="Large suburban ward featuring commercial hubs, high-rise residential complexes, and coastal fishing settlements.",
                    geometry_geojson={
                        "type": "Polygon",
                        "coordinates": [[
                            [72.820, 19.100], [72.865, 19.100],
                            [72.865, 19.145], [72.820, 19.145],
                            [72.820, 19.100]
                        ]]
                    }
                ),
                Location(
                    state="Delhi",
                    district="Central Delhi",
                    city="Delhi",
                    ward_code="WARD_CC",
                    ward_name="Chandni Chowk / Old Delhi",
                    latitude=28.6506,
                    longitude=77.2303,
                    area_sq_km=5.2,
                    population=360000,
                    population_density_per_km2=69230.0,
                    outdoor_worker_ratio=0.48,
                    informal_settlement_ratio=0.45,
                    tree_canopy_fraction=0.03,
                    elderly_ratio=0.088,
                    children_ratio=0.085,
                    cooling_access_deficit=0.70,
                    hospital_count=4,
                    drinking_water_deficit=0.52,
                    description="Hyper-dense historical market district. Extreme thermal inertia from masonry/asphalt, nearly zero canopy cover, and thousands of hand-cart pullers and vendors.",
                    geometry_geojson={
                        "type": "Polygon",
                        "coordinates": [[
                            [77.215, 28.640], [77.245, 28.640],
                            [77.245, 28.665], [77.215, 28.665],
                            [77.215, 28.640]
                        ]]
                    }
                ),
                Location(
                    state="Delhi",
                    district="North West Delhi",
                    city="Delhi",
                    ward_code="WARD_ROHINI",
                    ward_name="Rohini Sectors 15-22",
                    latitude=28.7383,
                    longitude=77.1086,
                    area_sq_km=16.8,
                    population=420000,
                    population_density_per_km2=25000.0,
                    outdoor_worker_ratio=0.22,
                    informal_settlement_ratio=0.15,
                    tree_canopy_fraction=0.15,
                    elderly_ratio=0.095,
                    children_ratio=0.070,
                    cooling_access_deficit=0.35,
                    hospital_count=6,
                    drinking_water_deficit=0.20,
                    description="Planned residential sectors with arterial roads and suburban parks.",
                    geometry_geojson={
                        "type": "Polygon",
                        "coordinates": [[
                            [77.085, 28.715], [77.135, 28.715],
                            [77.135, 28.760], [77.085, 28.760],
                            [77.085, 28.715]
                        ]]
                    }
                ),
            ]
            db.add_all(wards)
            db.commit()

        # 3. Seed Designated Municipal Cooling Shelters
        if db.query(CoolingCentre).count() == 0:
            print("Seeding Designated Municipal Cooling Centres...")
            centres = [
                CoolingCentre(
                    name="Govandi Municipal Maternity Home & Cooling Wing",
                    facility_type="Urban Primary Health Centre (UPHC)",
                    city="Mumbai",
                    ward_name="Ward M/East (Govandi)",
                    address="Govandi Station Road, Near Deonar Depot, Shivaji Nagar, Mumbai 400043",
                    latitude=19.0565,
                    longitude=72.9320,
                    capacity_persons=120,
                    current_occupancy=45,
                    amenities=["Air Conditioned Hall", "Chilled ORS Water Dispenser", "Dedicated Heatstroke Resuscitation Bed", "Free Rehydration Salts"],
                    operating_hours="24x7 Emergency Heat Wing",
                    contact_phone="022-25564812",
                ),
                CoolingCentre(
                    name="Shatabdi Municipal General Hospital Heat Relief Centre",
                    facility_type="Municipal Hospital",
                    city="Mumbai",
                    ward_name="Ward M/East (Govandi)",
                    address="Near Chembur-Govandi Link Road, Govandi East, Mumbai 400088",
                    latitude=19.0580,
                    longitude=72.9290,
                    capacity_persons=250,
                    current_occupancy=80,
                    amenities=["Air Conditioned Trauma Wards", "ICU Heat Stroke Unit", "Saline Infusion Stations", "Paramedic Triage"],
                    operating_hours="24x7",
                    contact_phone="022-25564000 / 108",
                ),
                CoolingCentre(
                    name="K.B. Bhabha Municipal Hospital Bandra Heat Facility",
                    facility_type="Municipal Hospital",
                    city="Mumbai",
                    ward_name="Ward H/East (Bandra)",
                    address="R.K. Patkar Marg, Bandra West, Mumbai 400050",
                    latitude=19.0550,
                    longitude=72.8360,
                    capacity_persons=180,
                    current_occupancy=30,
                    amenities=["Air Conditioned Waiting Lounge", "Emergency Hydration Counter", "Free Ice Packs & Fans"],
                    operating_hours="24x7",
                    contact_phone="022-26422775",
                ),
                CoolingCentre(
                    name="Churchgate Metro Station Air-Conditioned Transit Concourse",
                    facility_type="Public Transit Cooling Zone",
                    city="Mumbai",
                    ward_name="Ward A (Colaba / Fort)",
                    address="Subway Concourse Level, Churchgate Station, Mumbai 400020",
                    latitude=18.9322,
                    longitude=72.8264,
                    capacity_persons=300,
                    current_occupancy=95,
                    amenities=["Full AC Transit Concourse", "Drinking Water Fountains", "First Aid Booth", "Seating Benches"],
                    operating_hours="06:00 - 23:00",
                    contact_phone="1916 (BMC Disaster Control)",
                ),
                CoolingCentre(
                    name="Town Hall & Asiatic Society Shaded Public Library Hall",
                    facility_type="Heritage Cultural Cooling Shelter",
                    city="Mumbai",
                    ward_name="Ward A (Colaba / Fort)",
                    address="Shahid Bhagat Singh Road, Horniman Circle, Fort, Mumbai 400001",
                    latitude=18.9318,
                    longitude=72.8368,
                    capacity_persons=150,
                    current_occupancy=40,
                    amenities=["High-ceiling Stone Shaded Hall", "Clean Drinking Water", "Reading Seating"],
                    operating_hours="09:00 - 19:00",
                    contact_phone="022-22660956",
                ),
                CoolingCentre(
                    name="Town Hall Community Centre Chandni Chowk",
                    facility_type="Municipal Disaster Relief Shelter",
                    city="Delhi",
                    ward_name="Chandni Chowk",
                    address="Opposite Chandni Chowk Metro Gate 3, Old Delhi 110006",
                    latitude=28.6530,
                    longitude=77.2300,
                    capacity_persons=200,
                    current_occupancy=70,
                    amenities=["Evaporative Desert Coolers", "Electrolyte Jars", "Rest Cots", "Medical Attendant"],
                    operating_hours="08:00 - 21:00",
                    contact_phone="1077 (Delhi Disaster Helpline)",
                ),
            ]
            db.add_all(centres)
            db.commit()

        # 4. Seed Risk Configuration
        if db.query(RiskConfig).count() == 0:
            print("Seeding Risk Configuration parameters...")
            config = RiskConfig(
                config_name="default",
                weight_hazard=0.50,
                weight_exposure=0.25,
                weight_vulnerability=0.25,
                heatwave_temp_threshold_c=40.0,
                wbgt_work_stop_threshold_c=32.2,
            )
            db.add(config)
            db.commit()

        # 5. Seed Initial Heat Alert
        if db.query(Alert).count() == 0:
            print("Seeding Initial Early-Warning Alerts...")
            first_loc = db.query(Location).filter(Location.ward_code == "WARD_ME").first()
            if first_loc:
                alert = Alert(
                    location_id=first_loc.id,
                    alert_level="Orange Alert",
                    title="Severe Thermal Discomfort Warning: Govandi / Shivaji Nagar",
                    message="High humidity and intense solar radiation resulting in peak afternoon WBGT of 32.1°C. Elevated risk for outdoor workers and informal settlement residents.",
                    action_directives="Suspend non-essential outdoor manual labor between 12:00 PM and 04:00 PM. Drink ORS/buttermilk at hourly intervals. Municipal cooling wing at Govandi Maternity Home open.",
                    target_audience="all",
                    channels="web,sms,whatsapp",
                    is_active=True,
                )
                db.add(alert)
                db.commit()

        # 6. Seed Demo Users
        if db.query(User).count() == 0:
            print("Seeding Demo Users...")
            users = [
                User(
                    email="citizen@heatsense.in",
                    hashed_password=get_password_hash("citizen123"),
                    full_name="Pooja Sharma",
                    role="citizen",
                    city_preference="Mumbai",
                ),
                User(
                    email="worker@heatsense.in",
                    hashed_password=get_password_hash("worker123"),
                    full_name="Ramesh Patel (Construction Supervisor)",
                    role="worker",
                    city_preference="Mumbai",
                ),
                User(
                    email="authority@heatsense.in",
                    hashed_password=get_password_hash("authority123"),
                    full_name="Dr. Anil Deshmukh (Disaster Management Cell, BMC)",
                    role="authority",
                    city_preference="Mumbai",
                ),
            ]
            db.add_all(users)
            db.commit()

        print("Database seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
