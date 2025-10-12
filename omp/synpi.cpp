#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <omp.h>
static long num_steps = 1000000;
double pi_seq(long steps) {
	double sum = 0.0;
	double step = 1.0 / (double) steps;
	for (long i = 0; i < steps; ++i) {
		double x = (i + 0.5) * step;
		sum += 4.0 / (1.0 + x * x);
	}
	return step * sum;
}
double pi_atomic(long steps) {
	double sum = 0.0;
	double step = 1.0 / (double) steps;
#pragma omp parallel
	{
#pragma omp for
		for (long i = 0; i < steps; ++i) {
			double x = (i + 0.5) * step;
			double fx = 4.0 / (1.0 + x * x);
#pragma omp atomic
			sum += fx;
		}
	}
	return step * sum;
}
double pi_critical(long steps) {
	double sum = 0.0;
	double step = 1.0 / (double) steps;
#pragma omp parallel
	{
#pragma omp for
		for (long i = 0; i < steps; ++i) {
			double x = (i + 0.5) * step;
			double fx = 4.0 / (1.0 + x * x);
#pragma omp critical
			{
				sum += fx;
			}
		}
	}
	return step * sum;
}
double pi_reduction(long steps) {
	double sum = 0.0;
	double step = 1.0 / (double) steps;
#pragma omp parallel for reduction(+:sum)
	for (long i = 0; i < steps; ++i) {
		double x = (i + 0.5) * step;
		sum += 4.0 / (1.0 + x * x);
	}
	return step * sum;
}
int main(int argc, char **argv) {
	if (argc > 1) num_steps = atol(argv[1]);
	int threads = omp_get_max_threads();
	omp_set_num_threads(threads);
	printf("Steps = %ld, threads = %d\n"
		, num_steps, threads);
	double t0, t1;
	double pi_s, pi_a, pi_c, pi_r;
	double ts, ta, tc, tr;
	t0 = omp_get_wtime();
	pi_s = pi_seq(num_steps);
	t1 = omp_get_wtime();
	ts = t1 - t0;
	printf("SEQUENTIAL : pi = %.12f time = %f s\n"
		, pi_s, ts);
	t0 = omp_get_wtime();
	pi_a = pi_atomic(num_steps);
	t1 = omp_get_wtime();
	ta = t1 - t0;
	printf("ATOMIC : pi = %.12f time = %f s\n"
		, pi_a, ta);
	t0 = omp_get_wtime();
	pi_c = pi_critical(num_steps);
	t1 = omp_get_wtime();
	tc = t1 - t0;
	printf("CRITICAL : pi = %.12f time = %f s\n"
		, pi_c, tc);
	t0 = omp_get_wtime();
	pi_r = pi_reduction(num_steps);
	t1 = omp_get_wtime();
	tr = t1 - t0;
	printf("REDUCTION : pi = %.12f time = %f s\n"
		, pi_r, tr);
	printf("\nAccuracy check (abs diff from sequential):\n");
	printf("atomic diff = %.12g\n"
		, fabs(pi_s - pi_a));
	printf("critical diff = %.12g\n"
		, fabs(pi_s - pi_c));
	printf("reduction diff= %.12g\n"
		, fabs(pi_s - pi_r));
	printf("\nSpeedups (sequential_time / parallel_time):\n");
	if (ta > 0.0) printf("atomic : %f\n", ts / ta); 
	else printf("atomic : (no time)\n");
	if (tc > 0.0) printf("critical : %f\n", ts / tc); 
	else printf("critical : (no time)\n");
	if (tr > 0.0) printf("reduction : %f\n", ts / tr); 
	else printf("reduction : (no time)\n");

	return 0;
}


