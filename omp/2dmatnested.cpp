#include <iostream>
#include <vector>
#include <chrono>
#include <omp.h>
using namespace std;

int main() {
    int size = 1000;       // matrix size 1000x1000
    int threads = 4;       // number of threads for outer/inner

    omp_set_max_active_levels(2);
    omp_set_num_threads(threads);

    vector<vector<double>> A(size, vector<double>(size, 1.0));
    vector<vector<double>> B(size, vector<double>(size, 2.0));
    vector<vector<double>> C(size, vector<double>(size, 0.0));

    auto start = chrono::high_resolution_clock::now();

    #pragma omp parallel for
    for(int i = 0; i < size; i++) {

        #pragma omp parallel for
        for(int j = 0; j < size; j++) {
            double sum = 0.0;
            for(int k = 0; k < size; k++) {
                sum += A[i][k] * B[k][j];
            }
            C[i][j] = sum;
        }
    }

    auto end = chrono::high_resolution_clock::now();
    chrono::duration<double> elapsed = end - start;

    cout << "Nested parallel matrix multiplication took: " 
         << elapsed.count() << " seconds\n";

    return 0;
}
