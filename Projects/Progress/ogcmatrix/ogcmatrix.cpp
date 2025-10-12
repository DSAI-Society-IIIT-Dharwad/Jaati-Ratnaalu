// #include<bits/stdc++.h>
#include<iostream>
#include<thread>
#include<chrono>
#include <cstdlib>   // For std::rand() and std::srand()
#include <ctime>
using namespace std;
int main(){
    string s="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    string res="ARUNODAYA";
    string dis="";
    srand(static_cast<unsigned int>(time(0)));
    int k=0;
    for(int i=0;i<res.size();i++){
        int ind=rand()%26-1;
        while(s[ind]!=res[k]){
            cout<<dis;
            cout<<s[ind]<<"\r"<<flush;
            ind=rand()%26-1;
            this_thread::sleep_for(chrono::milliseconds(50));
        }
        dis+=s[ind];
        k++;
    }
    cout<<dis<<endl;
}