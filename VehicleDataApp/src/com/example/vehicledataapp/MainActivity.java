package com.example.vehicledataapp;

import java.util.Random;

import com.att.drive.InterfaceCallback;
import com.att.drive.model.Drive;
import com.att.drive.model.vehicleinfo.VehicleSpeed;

import android.app.Activity;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;

public class MainActivity extends Activity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
		
		Drive d = new Drive ();
		
		String [] compArray = {"vehicleinfo"};
		
		try {
			d.init("vehicledataapp", null, compArray);
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		setSpeed(d);
		
		//subscribeForSpeed(d);
		

	}

	private void subscribeForSpeed(Drive d) {
		
		d.vehicleinfo.vehicleSpeed.subscribe(new InterfaceCallback() {
		
		@Override
		public void callback(Object obj) {
			
			System.out.println(" ... Inside SUbscription Callback ...");
			
			VehicleSpeed speed = (VehicleSpeed) obj;
			
			System.out.println(" ***********************   Android Client  ****************************");
			System.out.println(" ***********************   Android Client  ****************************");
			System.out.println(" ***********************   Android Client  ****************************");
			
			System.out.println(" Speed = "+ speed.getSpeed());
		}
	});
		
	}

	/**
	 * 
	 * @param d
	 */
	private void setSpeed(Drive d) {
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

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle action bar item clicks here. The action bar will
		// automatically handle clicks on the Home/Up button, so long
		// as you specify a parent activity in AndroidManifest.xml.
		int id = item.getItemId();
		if (id == R.id.action_settings) {
			return true;
		}
		return super.onOptionsItemSelected(item);
	}
}
