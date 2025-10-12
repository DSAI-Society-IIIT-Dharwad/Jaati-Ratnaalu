#include <iostream>
#include <vector>
#include <chrono>
#include <omp.h>
using namespace std;

int main() {
    int size=1000;
    // cout << "Enter matrix size: ";
    // cin >> size;  
    omp_set_nested(1);

    vector<vector<double>> A(size, vector<double>(size, 1.0));
    vector<vector<double>> B(size, vector<double>(size, 2.0));
    vector<vector<double>> C(size, vector<double>(size, 0.0));

    int threads = 4; 
    omp_set_num_threads(threads);

    // --- Outer-loop parallelization ---
    auto start_outer = chrono::high_resolution_clock::now();

    #pragma omp parallel for
    for(int i = 0; i < size; i++) {
        for(int j = 0; j < size; j++) {
            double sum = 0.0;
            for(int k = 0; k < size; k++)
                sum += A[i][k] * B[k][j];
            C[i][j] = sum;
        }
    }

    auto end_outer = chrono::high_resolution_clock::now();
    chrono::duration<double> elapsed_outer = end_outer - start_outer;
    cout << "Outer-loop parallelization: " << elapsed_outer.count() << "s" << endl;

    // --- Inner-loop parallelization ---
    auto start_inner = chrono::high_resolution_clock::now();

    for(int i = 0; i < size; i++) {
        #pragma omp parallel for
        for(int j = 0; j < size; j++) {
            double sum = 0.0;
            for(int k = 0; k < size; k++)
                sum += A[i][k] * B[k][j];
            C[i][j] = sum;
        }
    }

    auto end_inner = chrono::high_resolution_clock::now();
    chrono::duration<double> elapsed_inner = end_inner - start_inner;
    cout << "Inner-loop parallelization: " << elapsed_inner.count() << "s" << endl;

    return 0;
}
