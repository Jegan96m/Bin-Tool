function toggleTable() {
    var table = document.getElementById('fiberTable');
    var toggleButtonleft = document.getElementById('toggleTableBtn-Left');
    var toggleButtonright = document.getElementById('toggleTableBtn-Right');

    bool = false
    if (table.style.display == 'none') {
        table.style.display = 'block';
        toggleButtonleft.style.display = 'block'
        toggleButtonright.style.display = 'none'

        
    } else {
        table.style.display = 'none';
        toggleButtonleft.style.display = 'none'
        toggleButtonright.style.display = 'block'
    }
}

// Attach click event listener to the button
document.getElementById('toggleTableBtn-Left').addEventListener('click', toggleTable);
document.getElementById('toggleTableBtn-Right').addEventListener('click', toggleTable);