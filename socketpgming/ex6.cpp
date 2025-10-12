#include<iostream>
#include<time.h>
#include<unistd.h>

using namespace std;
//func to check if channel is idle or busy
int is_channel_idle(){
	return rand()%2; // 0: busy, 1: idle
}

//func to simulate packet transmission
int transmit_packet(int packet_id, int tx_time){
	cout<<"Packet "<<packet_id<<" transmitting..\n";
	sleep(tx_time);
	return rand()%2; // 0: success, 1: collision
}

// Binary exponential backoff
void backoff(int attempt){
	int k=attempt<2?attempt:2; //cap exponent at 10
	int max_range=(1<<k)-1; //range [0, 2^k-1]
	int backoff_time = rand()%(max_range + 1);
	cout<<"Collision detected! Jamming.. Backing off for "<<backoff_time<<" seconds...\n";
	sleep(backoff_time);
}

int main(){
	srand(time(NULL));
	int num_packets, max_retry, tx_time;
	//user input
	cout<<"Enter number of packets to send: ";
	cin>>num_packets;
	cout<<"Enter maximum number of retries per packet: ";
	cin>>max_retry;
	cout<<"Enter transmission delay per packet (seconds): ";
	cin>>tx_time;
	cout<<"\n----------CSMA/CD (1-Persistent) Simulation---------\n";
	cout<<"Packets: "<<num_packets<<", Max retries: "<<max_retry<<", Transmission Time: "<< tx_time;
	int success_count = 0, fail_count = 0;
	for(int pkt = 1;pkt<=num_packets;pkt++){
		int attempt=0;
		int collision;
		while(attempt<max_retry){
			cout<<"\nAttempting to send packet "<<pkt<<" (Attempt "<<attempt+1<<")..\n";
			
			//1-persistent CSMA: Sense channel until idle
			while(!is_channel_idle()){
				cout<<"Channel busy... sensing..\n";
				sleep(1);
			}
			cout<<"Channel idle. Transmitting Packet "<<pkt<<"...\n";

			//Transmit and check collision
			collision = transmit_packet(pkt,tx_time);
			if(collision==0){
				cout<<"✅ Packet "<<pkt<<" transmitted successfully!\n";
				success_count++;
				break;
			}
			else{
				cout<<"❌Collision detected for Packet "<<pkt<<"!\n";
				attempt++;
				backoff(attempt);
			}
		}
		if(attempt==max_retry){
			cout<<"⚠️ Packet "<<pkt<<" dropped after "<<max_retry<<" attempts.\n";
			fail_count++;
		}
	}
	cout<<"\nAll packet transmission attempted.\n";
	return 0;
}
