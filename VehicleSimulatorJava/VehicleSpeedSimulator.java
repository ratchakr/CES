package com.att.drive.tests;

import java.util.Random;

import com.att.drive.model.Drive;
import com.att.drive.model.vehicleinfo.VehicleSpeed;

public class VehicleSpeedSimulator {
	public static void main(String[] args) {

/*		try {
			final Drive drive = new Drive();
			String [] compArray = {"vehicleinfo"};
			drive.init("VehicleInfoSimulator", new InterfaceCallback() {
				@Override
				public void callback(Object value) {
					Identification identification = new Identification();
					identification.setVin("TestVehicle17");
				
					VehicleSpeed vspeed = new VehicleSpeed();
					int speed = 0;

					
					Vehicleinfo vehicleInfo = new Vehicleinfo();
					
					int maxSpeed = 200;
					int step = 9;
					int c = 0;
					while (speed <= maxSpeed) {
						speed = speed + step;
						vehicleInfo.setVehicleSpeed(vspeed);
						c++;
						System.out.println("Setting Speed ... = "+ speed + " for : "+ c);
						drive.vehicleinfo.set(vehicleInfo);
						
						try {
							Thread.sleep(5000);
							System.out.println(" Woke Up ");
						} catch (InterruptedException e1) {
							e1.printStackTrace();
						}						
					}
				}
			},compArray);
			
		} catch (Exception e) {
		}*/
		
		Drive d = new Drive ();
		
		String [] compArray = {"vehicleinfo"};
		
		try {
			d.init("VehicleSpeedSimulator", null, compArray);
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		setSpeed(d);		
	
	}
	
	/**
	 * 
	 * @param d
	 */
	private static void setSpeed(Drive d) {
		VehicleSpeed s = new VehicleSpeed();
		
		Random randomGenerator = new Random();
	    for (int idx = 1; idx <= 30; ++idx) {
	      int randomSpeed = randomGenerator.nextInt(100);
	      	s.setSpeed(randomSpeed);
			d.vehicleinfo.vehicleSpeed.set(s);
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
