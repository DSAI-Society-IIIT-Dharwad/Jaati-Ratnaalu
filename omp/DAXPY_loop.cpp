#include <iostream>
#include <vector>
#include <chrono>
#include <omp.h>
using namespace std; 
int main(){
	int pow;
	cout<<"Enter size: 2^";
	cin>>pow;
	const int n = 1<<pow;
	double a = 2.5;

	for(int threads=1;threads<10;threads++){
		omp_set_num_threads(threads);
		vector<double> x(n,1.0),y(n,2.0);
		auto start = chrono::high_resolution_clock::now();

		#pragma omp parallel for 
		{
			for(int i=0;i<(int)x.size();i++){
				x[i]=a*x[i]+y[i];
			}
		}

		auto end = chrono::high_resolution_clock::now();
		
	    chrono::duration<double> elapsed = end - start;
	    cout << "Execution time: " << elapsed.count() << " seconds for "<<threads<<" threads." <<endl;

	}
}