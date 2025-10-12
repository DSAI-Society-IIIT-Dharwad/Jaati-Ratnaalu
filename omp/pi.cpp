#include <iostream>
#include <omp.h>
using namespace std;

static long num_steps = 100000;
double step;

int main() {
    double sum = 0.0;
    step = 1.0 / (double)num_steps;

    #pragma omp parallel for reduction(+:sum)
    for(long i = 0; i < num_steps; i++) {
        double x = (i + 0.5) * step;
        sum += 4.0 / (1.0 + x*x);
    }

    double pi = step * sum;
    cout << pi << endl;
}
