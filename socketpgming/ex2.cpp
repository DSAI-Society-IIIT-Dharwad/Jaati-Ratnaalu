#include <iostream>
#include <cstring>
#include <cstdlib>
#include <unistd.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <sys/types.h>

#define MAX 80
#define PORT 8080
#define SA struct sockaddr

void func(int sockfd) {
    char buff[MAX];
    int n;

    while (true) {
        bzero(buff, MAX);

        // Read from client
        read(sockfd, buff, sizeof(buff));
        printf("From client: %s\t To client: ", buff);

        bzero(buff, MAX);
        n = 0;
        // Read input from server's stdin
        while ((buff[n++] = getchar()) != '\n');

        // Send to client
        write(sockfd, buff, sizeof(buff));

        // Exit if "exit" is typed
        if (strncmp("exit", buff, 4) == 0) {
            printf("Server exiting...\n");
            break;
        }
    }
}

int main() {
    int sockfd, connfd, len;
    struct sockaddr_in servaddr, cli;

    // Socket creation
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd == -1) {
        printf("Socket creation failed!\n");
        exit(0);
    } else {
        printf("Socket successfully created!\n");
    }

    bzero(&servaddr, sizeof(servaddr));

    // Assign IP and PORT

    servaddr.sin_port = htons(PORT);

    // Bind socket
    if ((bind(sockfd, (SA*)&servaddr, sizeof(servaddr))) != 0) {
        printf("Socket bind failed!\n");
        exit(0);
    } else {
        printf("Socket successfully binded!\n");
    }

    // Listen
    if ((listen(sockfd, 5)) != 0) {
        printf("Listen failed!\n");
        exit(0);
    } else {
        printf("Server listening...\n");
    }

    len = sizeof(cli);

    // Accept the data packet from client
    connfd = accept(sockfd, (SA*)&cli, (socklen_t*)&len);
    if (connfd < 0) {
        printf("Server accept failed!\n");
        exit(0);
    } else {
        printf("Server accepted the client!\n");
    }

    // Function for chat
    func(connfd);

    // Close socket
    close(sockfd);
}

