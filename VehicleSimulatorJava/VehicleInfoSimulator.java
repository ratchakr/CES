package com.att.drive.tests;

import java.io.IOException;
import java.util.Random;

import com.att.drive.DecList;
import com.att.drive.InterfaceCallback;
import com.att.drive.Promise;
import com.att.drive.model.Drive;
import com.att.drive.model.vehicleinfo.Configuration;
import com.att.drive.model.vehicleinfo.EngineOil;
import com.att.drive.model.vehicleinfo.Fuel;
import com.att.drive.model.vehicleinfo.Identification;
import com.att.drive.model.vehicleinfo.Odometer;
import com.att.drive.model.vehicleinfo.Transmission;
import com.att.drive.model.vehicleinfo.VehicleSpeed;
import com.att.drive.model.vehicleinfo.Vehicleinfo;
import com.att.drive.model.vehicleinfo.seat.Seat;
import com.att.drive.model.vehicleinfo.tire.Tire;
import com.att.drive.model.vehicleinfo.tire.Zones;
import com.fasterxml.jackson.core.JsonGenerationException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class VehicleInfoSimulator {
	public static void main(String[] args) {

		try {
			final Drive drive = new Drive();
			String [] compArray = {"vehicleinfo"};
			
			try {
				drive.init("VehicleInfoSimulator", null, compArray);
			} catch (Exception e) {
				e.printStackTrace();
			}
			
			setData(drive);
			
			//setAllData(drive, compArray);
			
		} catch (Exception e) {
		}
	
	}

	private static void setAllData(final Drive drive, String[] compArray)
			throws InstantiationException, IllegalAccessException {
		drive.init("VehicleInfoSimulator", new InterfaceCallback() {
			@Override
			public void callback(Object value) {
				drive.vehicleinfo.subscribe(new InterfaceCallback() {
					@Override
					public void callback(Object value) {
						//System.out.println(" Inside Callback =   "+ value);
						Vehicleinfo vehicleinfo = (Vehicleinfo) value;
						
						System.out.println("Odometer TotalDistance = "+vehicleinfo.getOdometer().getDistanceTotal());
					}
				});
				Identification identification = new Identification();
				identification.setVin("TestVehicle17");
				identification.setCategory("Commercial");
				identification.setBrand("Honda");
			
				Configuration configuration = new Configuration();
				configuration.setFuelType("CNG");
				drive.vehicleinfo.configuration.set(configuration);
				
				Fuel fuel = new Fuel ();
				fuel.setLevel(36);
				fuel.setRange(63);
				Tire tire = new Tire ();
				DecList<Zones> zonesList = new DecList<>();
				Zones z1 = new Zones ();
				z1.setZone("FrontLeft");
				z1.setPressure(48);
				zonesList.add(z1);
				Zones z2 = new Zones ();
				z2.setZone("FrontRight");
				z2.setPressure(36);
				zonesList.add(z2);
				
				Zones z3 = new Zones ();
				z3.setZone("RearRight");
				z3.setPressure(27);
				zonesList.add(z3);
				
				Zones z4 = new Zones ();
				z4.setZone("RearLeft");
				z4.setPressure(72);
				zonesList.add(z4);
				tire.setZones(zonesList);
				
				Transmission tr = new Transmission();
				tr.setTransmissionMode("Drive");
				
				VehicleSpeed speed = new VehicleSpeed();
				speed.setSpeed(81);
				
				Odometer odo = new Odometer();
				odo.setDistanceTotal(99000);
				
				EngineOil oil = new EngineOil();
				oil.setTemperature(new Long (65));
				oil.setRemaining(15);
				
				Vehicleinfo vehicleInfo = new Vehicleinfo();
				vehicleInfo.setConfiguration(configuration);
				vehicleInfo.setIdentification(identification);
				vehicleInfo.setTire(tire);
				vehicleInfo.setFuel(fuel);
				vehicleInfo.setTransmission(tr);
				vehicleInfo.setOdometer(odo);
				vehicleInfo.setVehicleSpeed(speed);
				vehicleInfo.setEngineOil(oil);
				
				Seat seat = new Seat ();
				
				DecList<com.att.drive.model.vehicleinfo.seat.Zones> zones2 = new DecList<com.att.drive.model.vehicleinfo.seat.Zones>();
				com.att.drive.model.vehicleinfo.seat.Zones z = new com.att.drive.model.vehicleinfo.seat.Zones ();
				z.setZone("FrontLeft");
				z.setSeatbelt(true);
				
				zones2.add(z);
				seat.setZones(zones2);
				
				drive.vehicleinfo.set(vehicleInfo);
				
				try {
					Thread.sleep(3000);
				} catch (InterruptedException e1) {
					e1.printStackTrace();
				}
				
				
				Promise promise = drive.vehicleinfo.get();
				promise.then(new InterfaceCallback() {
					@Override
					public void callback(Object value) {
						System.out.println("vehicle Data received callback:::" + value);
						if (value == null) {
							System.out.println( "Didn't find Data in deccore****");
						} else {
							Vehicleinfo vehicleinfo = (Vehicleinfo) value;
							if (vehicleinfo.getOdometer() != null) {
								System.out.println("Odometer = "+vehicleinfo.getOdometer().getDistanceTotal());	
							}
							
							ObjectMapper objectMapper= new ObjectMapper();
							String vehcicleInfoData = null;
							try {
								vehcicleInfoData = objectMapper.writeValueAsString(vehicleinfo);
							} catch (JsonGenerationException e) {
								e.printStackTrace();
							} catch (JsonMappingException e) {
								e.printStackTrace();
							} catch (IOException e) {
								e.printStackTrace();
							}
							System.out.println("vehcicleInfoData :::::::::: "+vehcicleInfoData);
						}
					}
				}, new InterfaceCallback() {
					@Override
					public void callback(Object value) {
						System.out.println("Vehicle info Data :::" + value);
					}
				});
			}
		},compArray);
	}

	/**
	 * 
	 * @param drive
	 */
	private static void setData(Drive drive) {

		VehicleSpeed s = new VehicleSpeed();
		Odometer o = new Odometer();
		Random randomGenerator = new Random();
	    for (int idx = 1; idx <= 30; ++idx) {
	      int dis = randomGenerator.nextInt(10000);
	      	o.setDistanceTotal(dis);
			drive.vehicleinfo.odometer.set(o);
			System.out.println("Set Odometer Distance to = "+ o.getDistanceTotal());

			int randomSpeed = randomGenerator.nextInt(36);
			s.setSpeed(randomSpeed);
			drive.vehicleinfo.vehicleSpeed.set(s);
			System.out.println("Set Vehicle Speed to = "+ s.getSpeed());
			
			
			try {
				Thread.sleep(5000);
				System.out.println(" Woke Up ");
			} catch (InterruptedException e1) {
				e1.printStackTrace();
			}	      
	    }		
	}
}
