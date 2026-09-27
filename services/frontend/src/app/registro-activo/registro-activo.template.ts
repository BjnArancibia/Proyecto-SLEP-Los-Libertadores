export class RegistroActivoTemplate {
    estadosConservacion: string[] = ['Bueno', 'Regular', 'Malo', 'Fuera de servicio'];
    estadoSeleccionado: string = 'Bueno';

    seleccionarEstado(estado: string): void {
        this.estadoSeleccionado = estado;
    }
}
