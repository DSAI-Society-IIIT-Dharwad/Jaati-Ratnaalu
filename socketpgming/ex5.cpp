#include <stdio.h>
#include<stdlib.h>
#include<time.h>
#include<unistd.h>

//Global slot counter
int slot_counter = 0;

//Function to simulate packet transmission in a slot
int transmit_packet(int packet_id, int channel_delay){
	slot_counter++;
	printf("[Slot %d] Packet %d sent to the channel..\n",slot_counter,packet_id);
	sleep(channel_delay);
	return rand()%2;
}

//Function to simulate backoff
void backoff(){
	int backoff_time=rand()%3+1;
	printf("Backing off for %d slots..\n", backoff_time);
	slot_counter+=backoff_time;
	sleep(backoff_time);
}

int main(){
	srand(time(NULL));
	int num_packets, max_retry, channel_delay;
	//Take user input
	printf("Enter number of packets to send: ");
	scanf("%d", &num_packets);
	printf("Enter maximum retries per packet: ");
	scanf("%d", &max_retry);
	printf("Enter channel transmission delay (in seconds): ");
	scanf("%d", &channel_delay);
	printf("\n-----Slotted ALOHA simulation------\n");
	printf("Packets: %d, Max Retries: %d, Channel delay: %d sec \n\n",num_packets,max_retry,channel_delay);
	//simulate packet transmisssion
	for(int packet_id = 1 ; packet_id<=num_packets;packet_id++){
		int retry_count=0;
		int collision;
		while(retry_count<max_retry){
			printf("\nAttempting to send packet %d (Attempt %d)...\n",packet_id,retry_count+1);
			//Transmit and check for collisionu
			collision = transmit_packet(packet_id,channel_delay);
			if(collision == 0){
				printf("✅ Packet %d successfully transmitted!\n", packet_id);
				break;
			}
			else{
				printf("❌ Collision detected for Packet %d!\n", packet_id);
				backoff();
				retry_count++;
			}
		}
		if(retry_count==max_retry){
			printf("⚠️ Packet %d failed after %d retries. Dropping packet. |n",packet_id,max_retry);
		}
	}
	printf("\n All packet transmissions Attempted.\n");
	return 0;
}