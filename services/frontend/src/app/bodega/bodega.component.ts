import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { KardexComponent } from "../kardex/kardex.component";
import { KardexService } from "../services/kardex.service";
import { AuthService, Usuario } from "../services/auth.service";
import { MovimientosService } from "../services/movimientos.service";

export type SubpestanaBodega = "kardex" | "inventario" | "despacho";

export interface ArticuloInventarioBodega {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  stockActual: number;
  stockMinimo: number;
  unidad: string;
  docReferencia: string;
  ultimoMovimiento: string;
}

export const UMBRAL_STOCK_CRITICO_ESTANDAR = 10;

@Component({
  selector: "app-bodega",
  standalone: true,
  imports: [CommonModule, FormsModule, KardexComponent],
  templateUrl: "./bodega.component.html",
  styleUrl: "./bodega.component.css",
})
export class BodegaComponent {
  private kardexService = inject(KardexService);
  private authService = inject(AuthService);
  private movimientosService = inject(MovimientosService);

  // Umbral estándar global de stock crítico para todos los insumos
  readonly umbralCriticoEstandar = UMBRAL_STOCK_CRITICO_ESTANDAR;

  // Control de submódulos desacoplados y escalables dentro de Bodega
  subpestanaActiva = signal<SubpestanaBodega>("kardex");

  // Filtros de búsqueda para inventario general
  busquedaInventario = signal<string>("");
  categoriaSeleccionada = signal<string>("Todas");

  // Categorías disponibles en bodega central
  readonly categorias = [
    "Todas",
    "Stock Crítico",
    "Insumos de oficina",
    "Equipamiento computacional",
    "Mobiliario escolar",
    "Aseo y desinfección",
  ];

  // Catálogo reactivo sincronizado dinámicamente con KardexService
  readonly articulosInventario = computed<ArticuloInventarioBodega[]>(() => {
    return this.kardexService.catalogoProductos().map((prod) => ({
      id: prod.id,
      codigo: prod.codigo,
      nombre: prod.nombre,
      categoria: prod.categoria,
      ubicacion: prod.ubicacionBodega,
      stockActual: this.kardexService.getStockDeProducto(prod.id),
      stockMinimo: prod.stockMinimoAlerta,
      unidad: prod.unidadMedida,
      docReferencia: prod.documentoReferencia || "—",
      ultimoMovimiento: this.kardexService.getUltimoMovimientoFecha(prod.id),
    }));
  });

  // Datos reactivos del KardexService
  readonly productoKardex = this.kardexService.producto;
  readonly stockActualKardex = this.kardexService.stockActual;
  readonly totalEntradasKardex = this.kardexService.totalEntradas;
  readonly totalSalidasKardex = this.kardexService.totalSalidas;
  readonly stockEsCriticoKardex = this.kardexService.stockEsCritico;
  readonly movimientosKardex = this.kardexService.movimientos;

  // Usuario autenticado
  readonly usuarioActual = computed<Usuario | null>(() =>
    this.authService.usuario(),
  );

  // KPIs globales consolidados del módulo Bodega (alerta si al menos un insumo tiene stock <= 10)
  readonly metricasBodega = computed(() => {
    const articulos = this.articulosInventario();
    const totalArticulos = articulos.length;
    const articulosCriticos = articulos.filter(
      (a) => a.stockActual <= UMBRAL_STOCK_CRITICO_ESTANDAR,
    ).length;
    const stockTotalItems = articulos.reduce(
      (acc, curr) => acc + curr.stockActual,
      0,
    );

    return {
      totalArticulos,
      articulosCriticos,
      stockTotalItems,
      movimientosRecientes: this.kardexService.todosLosMovimientos().length,
    };
  });

  // Inventario filtrado reactivamente por texto y categoría (cuando es 'Todas', muestra el 100% de productos)
  readonly inventarioFiltrado = computed(() => {
    const busqueda = this.busquedaInventario().trim().toLowerCase();
    const cat = this.categoriaSeleccionada();

    return this.articulosInventario().filter((item) => {
      let coincideCat = false;
      if (cat === "Todas") {
        coincideCat = true;
      } else if (cat === "Stock Crítico") {
        coincideCat = item.stockActual <= UMBRAL_STOCK_CRITICO_ESTANDAR;
      } else {
        coincideCat = item.categoria === cat;
      }

      const coincideTexto =
        !busqueda ||
        item.nombre.toLowerCase().includes(busqueda) ||
        item.codigo.toLowerCase().includes(busqueda) ||
        item.docReferencia.toLowerCase().includes(busqueda) ||
        item.ubicacion.toLowerCase().includes(busqueda);
      return coincideCat && coincideTexto;
    });
  });

  // Movimientos de despacho / recepción globales
  readonly despachosYRecepciones = computed(() => {
    return this.kardexService.todosLosMovimientos().map((m) => ({
      folio: m.folio,
      fecha: m.fecha,
      tipo: m.tipo,
      tipoLabel: m.tipoLabel,
      cantidad: Math.abs(m.cantidad),
      origenDestino: m.origenDestino,
      responsable: m.responsableNombre,
      documento: m.documentoReferencia || "—",
      estado: "Completado",
    }));
  });

  // Métodos de navegación y control
  seleccionarSubpestana(pestana: SubpestanaBodega): void {
    this.subpestanaActiva.set(pestana);
  }

  verKardexProducto(productoId: string): void {
    this.kardexService.seleccionarProducto(productoId);
    this.subpestanaActiva.set("kardex");
  }

  cambiarCategoria(cat: string): void {
    this.categoriaSeleccionada.set(cat);
  }

  onBuscarInventario(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.busquedaInventario.set(target.value);
  }

  esStockBajo(articulo: ArticuloInventarioBodega): boolean {
    return articulo.stockActual <= articulo.stockMinimo;
  }
}
