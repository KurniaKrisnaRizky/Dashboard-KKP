document.addEventListener("DOMContentLoaded", async () => {
    const data = await fetch("datasetsuperstore.json").then(res => res.json());

    // Fungsi untuk parsing nilai
    const parseProfit = (value) => parseFloat(value.replace('.', '').replace(',', '.'));
    const parseSales = (value) => parseFloat(value.replace('.', '').replace(',', '.'));
    const parseDiscount = (value) => parseFloat(value.replace('.', '').replace(',', '.'));
    const parseShipping = (value) => parseFloat(value.replace('.', '').replace(',', '.'));

    // Nama-nama bulan dalam bahasa Indonesia
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    // Mengambil daftar unik dari field tertentu
    function getUniqueValues(data, key) {
        return [...new Set(data.map(item => item[key]))].sort();
    }

    // Memfilter data berdasarkan Region, State, dan Year
    function filterData(data, region, state, year) {
        return data.filter(item => {
            const itemRegion = item.Region.toLowerCase();
            const itemState = item.State.toLowerCase();
            const itemYear = item.Tahun; // Mengambil tahun dari field 'Tahun'

            return (
                (region === "" || itemRegion === region) &&
                (state === "" || itemState === state) &&
                (year === "" || itemYear === year) // Menggunakan item.Tahun untuk filter
            );
        });
    }

    // Menginisialisasi filter options
    const regions = getUniqueValues(data, "Region");
    const states = getUniqueValues(data, "State");
    const years = [...new Set(data.map(item => item.Tahun))].sort(); // Mengambil tahun dari field 'Tahun'

    // Memasukkan options ke dropdown Region, State, dan Year
    const regionSelect = document.getElementById("filter-region");
    const stateSelect = document.getElementById("filter-state");
    const yearSelect = document.getElementById("filter-year");

    regions.forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });

    states.forEach(state => {
        const option = document.createElement("option");
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });

    years.forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    // Memiliki variabel untuk menyimpan grafik
    let shippingCostChart, transactionsChart, profitChart, discountImpactChart, profitShippingRegionChart, profitTransactionsRegionChart;

    // Event listener untuk perubahan filter
    regionSelect.addEventListener("change", updateChart);
    stateSelect.addEventListener("change", updateChart);
    yearSelect.addEventListener("change", updateChart);

    // Fungsi untuk memperbarui grafik dan total berdasarkan filter
    function updateChart() {
        const region = regionSelect.value.toLowerCase();
        const state = stateSelect.value.toLowerCase();
        const year = yearSelect.value;

        const filteredData = filterData(data, region, state, year);

        // Memperbarui total yang terfilter
        updateTotal(filteredData);

        // Memperbarui grafik
        updateCharts(filteredData);
    }

    // Fungsi untuk menghancurkan grafik yang ada
    function destroyCharts() {
        if (shippingCostChart) shippingCostChart.destroy();
        if (transactionsChart) transactionsChart.destroy();
        if (profitChart) profitChart.destroy();
        if (discountImpactChart) discountImpactChart.destroy();
        if (profitShippingRegionChart) profitShippingRegionChart.destroy();
        if (profitTransactionsRegionChart) profitTransactionsRegionChart.destroy();
    }

    // Fungsi untuk menghitung dan memperbarui total (Unit Sales, Revenue, Profit)
    function updateTotal(filteredData) {
        // Menghitung data untuk kartu
        const totalUnitSales = filteredData.reduce((acc, item) => acc + parseInt(item.Quantity), 0);
        const totalRevenue = filteredData.reduce((sum, item) => sum + (parseSales(item.Sales) * parseInt(item.Quantity)), 0);
        const totalProfit = filteredData.reduce((sum, item) => sum + parseProfit(item.Profit), 0);

        // Memperbarui elemen total di HTML
        
        document.getElementById("total-unit-sales").textContent = `${Math.trunc(totalUnitSales / 1000)} M`;


        const formattedRevenue = ((totalRevenue / 1000000)+0.003); // Membagi dengan 1 juta dan memotong desimal
        document.getElementById("total-revenue").textContent = `${formattedRevenue.toLocaleString()} M`;
        const formattedProfit = (totalProfit / 1000 + 0.003);
        document.getElementById("total-profit").textContent = `${formattedProfit.toLocaleString()} K`;
    }

    // Fungsi untuk menghitung dan memperbarui grafik
    function updateCharts(filteredData) {
        // Menghancurkan grafik yang ada sebelum membuat yang baru
        destroyCharts();

        const months = Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, ..., 12]

        const monthlyShippingCost = months.map(month =>
            filteredData.filter(item => parseInt(item.Bulan) === month)
                .reduce((acc, item) => acc + parseShipping(item.Shipping_Cost), 0)
        );
        const monthlyTransactions = months.map(month =>
            filteredData.filter(item => parseInt(item.Bulan) === month).length
        );
        const monthlyProfit = months.map(month =>
            filteredData.filter(item => parseInt(item.Bulan) === month)
                .reduce((acc, item) => acc + parseProfit(item.Profit), 0)
        );
        const discountImpact = months.map(month => ({
            discount: filteredData.filter(item => parseInt(item.Bulan) === month)
                .reduce((acc, item) => acc + parseDiscount(item.Discount.replace('%', '')) / 100 * parseSales(item.Sales), 0),
            profit: filteredData.filter(item => parseInt(item.Bulan) === month)
                .reduce((acc, item) => acc + parseProfit(item.Profit), 0)
        }));

        // **Menghitung total profit dan shipping cost per region**
        const regions = [...new Set(filteredData.map(item => item.Region))];
        const profitPerRegion = regions.map(region =>
            filteredData.filter(item => item.Region === region)
                .reduce((acc, item) => acc + parseProfit(item.Profit), 0)
        );
        const shippingCostPerRegion = regions.map(region =>
            filteredData.filter(item => item.Region === region)
                .reduce((acc, item) => acc + parseShipping(item.Shipping_Cost), 0)
        );
        const quantityPerRegion = regions.map(region =>
            filteredData.filter(item => item.Region === region)
                .reduce((acc, item) => acc + parseInt(item.Quantity), 0)
        );

        // Memperbarui grafik
        shippingCostChart = createShippingCostChart(monthNames, monthlyShippingCost);
        transactionsChart = createMonthlyTransactionsChart(monthNames, monthlyTransactions);
        profitChart = createMonthlyProfitChart(monthNames, monthlyProfit);
        discountImpactChart = createDiscountImpactChart(monthNames, discountImpact);
        profitShippingRegionChart = createProfitShippingRegionChart(regions, profitPerRegion, shippingCostPerRegion);
        profitTransactionsRegionChart = createProfitTransactionsRegionChart(regions, profitPerRegion, quantityPerRegion);
    }

    // Membuat grafik untuk Shipping Cost per Month
    function createShippingCostChart(monthNames, monthlyShippingCost) {
        // Menghitung total biaya pengiriman untuk mendapatkan persentase
        const totalShippingCost = monthlyShippingCost.reduce((acc, cost) => acc + cost, 0);
        const shippingCostPercentages = monthlyShippingCost.map(cost => (cost / totalShippingCost) * 100);
    
        return new Chart(document.getElementById("shipping-cost-chart"), {
            type: "bar",
            data: {
                labels: monthNames, // Bulan ditampilkan di sumbu Y
                datasets: [{
                    data: shippingCostPercentages, // Data persentase untuk sumbu X
                    backgroundColor: "rgba(17, 41, 255, 0.6)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Mengizinkan kontrol ukuran secara manual
                devicePixelRatio: 2,
                indexAxis: 'y', // Mengatur orientasi menjadi horizontal
                plugins: {
                    title: {
                        display: true,
                        text: "Shipping Cost Percentage per Month".toUpperCase(),
                        font: { size: 18, family: 'Cambria, serif' },
                        color: 'rgba(17, 41, 255, 0.6)',                        
                    },
                    legend: {
                        display: false // Menghilangkan legend secara keseluruhan
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.raw.toFixed(2)}%`; // Format tooltip menampilkan persen
                            }
                        }
                    },
                    datalabels: { // Menambahkan data label
                        anchor: 'end',
                        align: 'right',
                        formatter: (value) => `${value.toFixed(2)}%`,
                        color: '#605E5C',
                        font: { size: 9, family: 'arial, serif', weight: 'bold' }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return `${value}%`; // Menampilkan label persentase di sumbu X
                            },
                            color: '#555', // Warna label sumbu X
                            font: { size: 12, family: 'Arial' }
                        },
                        title: {
                            display: true,
                            text: "Percentage (%)",
                            color: '#605E5C',
                            font: { size: 12, family: 'Arial' }
                        }
                    },
                    y: {
                        ticks: {
                            color: '#555', // Warna label bulan
                            font: { size: 12, family: 'Arial' }
                        },
                        title: {
                            display: true,
                            color: '#333',
                            font: { size: 14, family: 'Arial' }
                        }
                    }
                }
            },
            plugins: [ChartDataLabels] // Menambahkan plugin ChartDataLabels
        });
    }
    
    

    // Membuat grafik untuk Transactions per Month
    function createMonthlyTransactionsChart(monthNames, monthlyTransactions) {
        return new Chart(document.getElementById("monthly-transactions-chart"), {
            type: "line",
            data: {
                labels: monthNames,
                datasets: [{
                    label: "Transactions",
                    data: monthlyTransactions,
                    borderColor: "rgba(17, 41, 255, 0.6)",
                    fill: false
                }]
            },
            options: {
                devicePixelRatio: 2,
                plugins: {
                    title: {
                        display: true,
                        text: "Transactions per Month".toUpperCase(),
                        font: { size: 18, family: 'Cambria, serif' },
                        color: 'rgba(17, 41, 255, 0.6)'
                    },
                    legend: {
                        display: false // Menghilangkan legend secara keseluruhan
                    },
                }
            }
        });
    }

    // Membuat grafik untuk Profit per Month
    function createMonthlyProfitChart(monthNames, monthlyProfit) {
        return new Chart(document.getElementById("monthly-profit-chart"), {
            type: "line",
            data: {
                labels: monthNames,
                datasets: [{
                    label: "Profit",
                    data: monthlyProfit,
                    borderColor: "rgba(17, 41, 255, 0.6)",
                    fill: false
                }]
            },
            options: {
                devicePixelRatio: 2,
                plugins: {
                    title: {
                        display: true,
                        text: "Profit per Month".toUpperCase(),
                        font: { size: 18, family: 'Cambria, serif' },
                        color: 'rgba(17, 41, 255, 0.6)'
                    },
                    legend: {
                        display: false // Menghilangkan legend secara keseluruhan
                    },
                }
            }
        });
    }

    // Membuat grafik untuk Discount Impact per Month
    function createDiscountImpactChart(monthNames, discountImpact) {
        return new Chart(document.getElementById("discount-impact-chart"), {
            type: "bar",
            data: {
                labels: monthNames,
                datasets: [
                    {
                        label: "Profit",
                        data: discountImpact.map(item => item.profit),
                        backgroundColor: "rgba(17, 41, 255, 0.6)"
                    },
                    {
                        label: "Discount",
                        data: discountImpact.map(item => item.discount),
                        type: "line",
                        borderColor: "rgba(18, 35, 158, 1)",
                        fill: false
                    }
                ]
            },
            options: {
                devicePixelRatio: 2,
                plugins: {
                    title: {
                        display: true,
                        text: "The Effect of Discounts on Monthly Profit".toUpperCase(),
                        font: {
                            size: 18, 
                            family: 'Cambria, serif',
                        },
                          color : 'rgba(17, 41, 255, 0.6)'
                    },
                    legend: {
                        display: false // Menghilangkan legend secara keseluruhan
                    },
                }
            }
        });
    }

    // Membuat grafik Profit per Region
    function createProfitShippingRegionChart(regions, profitPerRegion, shippingCostPerRegion) {
        return new Chart(document.getElementById("profit-shipping-region-chart"), {
            type: "bar",
            data: {
                labels: regions,
                datasets: [{
                    label: "Profit",
                    data: profitPerRegion,
                    backgroundColor: "rgba(17, 41, 255, 0.6)"
                }, {
                    label: "Shipping Cost",
                    data: shippingCostPerRegion,
                    backgroundColor: "rgba(18, 35, 158, 1)"
                }]
            },
            options: {
                devicePixelRatio: 2,
                plugins: {
                    title: {
                        display: true,
                        text: "Profit vs Shipping Cost per Region".toUpperCase(),
                        font: { size: 18, family: 'Cambria, serif' },
                        color: 'rgba(17, 41, 255, 0.6)'
                    },
                    legend: {
                        display: false // Menghilangkan legend secara keseluruhan
                    },
                }
            }
        });
    }

    // Membuat grafik Profit per Transaction in Region
    function createProfitTransactionsRegionChart(regions, profitPerRegion, quantityPerRegion) {
        return new Chart(document.getElementById("profit-transactions-region-chart"), {
            type: "bar",
            data: {
                labels: regions,
                datasets: [{
                    label: "Profit",
                    data: profitPerRegion,
                    backgroundColor: "rgba(17, 41, 255, 0.6)"
                }, {
                    label: "Quantity",
                    data: quantityPerRegion,
                    backgroundColor: "rgba(18, 35, 158, 1)"
                }]
            },
            options: {
                devicePixelRatio: 2,
                plugins: {
                    title: {
                        display: true,
                        text: "Profit vs Quantity per Region".toUpperCase(),
                        font: { size: 18, family: 'Cambria, serif' },
                        color: 'rgba(17, 41, 255, 0.6)'
                    },
                    legend: {
                        display: false // Menghilangkan legend secara keseluruhan
                    },
                }
            }
        });
    }

    // Memulai update grafik pertama kali
    updateChart();
});


