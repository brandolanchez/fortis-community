export interface Routine {
    id: string;
    title: string;
    level: 'Principiante' | 'Intermedio' | 'Avanzado';
    duration: string;
    exercises: number;
    points: number;
    image: string;
    description: string;
    content: string;
}

export const ROUTINES_DATA: Routine[] = [
    {
        id: 'full-body-explosivo',
        title: 'Full Body Explosivo',
        level: 'Intermedio',
        duration: '45 min',
        exercises: 8,
        points: 150,
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
        description: 'Una rutina diseñada para activar todas las cadenas musculares con movimientos explosivos.',
        content: `
# Full Body Explosivo

Esta rutina está enfocada en la **potencia** y la **resistencia muscular**. Ideal para atletas que ya dominan los básicos y buscan transferir esa fuerza a movimientos más dinámicos.

## Objetivos
- Aumentar el reclutamiento de fibras rápidas.
- Mejorar la capacidad cardiovascular bajo tensión.
- Refinar la técnica en movimientos compuestos.

## Calentamiento (10 min)
Realiza 2 rondas de:
1. Jumping Jacks: 50 reps
2. Arm Circles: 20 reps (cada lado)
3. Squat to Thoracic Rotation: 10 reps

## Bloque Principal
> Realiza cada ejercicio con la máxima velocidad en la fase concéntrica y control en la fase excéntrica.

| Ejercicio | Series | Reps | Descanso |
| :--- | :---: | :---: | :---: |
| Explosive Pull-ups | 4 | 6-8 | 90s |
| Plyo Push-ups | 4 | 10 | 60s |
| Jump Squats | 4 | 12 | 60s |
| Knee-to-Chest Spills | 3 | 15 | 45s |

![Atleta entrenando](https://images.unsplash.com/photo-1598971440307-521444b6bc44?w=800&q=80)

## Recomendaciones
Asegúrate de mantener el **magnesio** en tus manos para evitar resbalones durante las dominadas explosivas. Si sientes que la forma se degrada, reduce las repeticiones pero mantén la explosividad.
        `
    },
    {
        id: 'pull-up-mastery',
        title: 'Pull-up Mastery',
        level: 'Avanzado',
        duration: '30 min',
        exercises: 6,
        points: 200,
        image: 'https://images.unsplash.com/photo-1598971440307-521444b6bc44?w=800&q=80',
        description: 'Lleva tus dominadas al siguiente nivel con progresiones de fuerza y técnica.',
        content: `
# Pull-up Mastery

El camino hacia el Muscle-up comienza aquí. Esta rutina se centra en la fuerza de tracción pura y la estabilidad escapular.

## La Importancia de la Técnica
No se trata de subir la barbilla, se trata de **bajar la barra al pecho**. La retracción escapular es la clave del poder.

## Estructura del Entrenamiento
1. **Weighted Pull-ups**: 5x5 (Usar peso si es posible)
2. **Archer Pull-ups**: 3x8 por lado
3. **Explosive High Pull-ups**: 4x5 (Intentar tocar la barra con el ombligo)
4. **Scapular Pull-ups**: 3x15 (Control total)

## Nutrición Post-Entreno
Recuerda que para construir músculo denso necesitas proteínas de calidad. ¡No olvides hidratarte!
        `
    },
    {
        id: 'core-de-acero',
        title: 'Core de Acero',
        level: 'Principiante',
        duration: '20 min',
        exercises: 5,
        points: 100,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
        description: 'Fortalece tu zona media para una base sólida en calistenia.',
        content: `
# Core de Acero

Sin un núcleo fuerte, la calistenia es imposible. Esta rutina es la base para el L-sit y el Front Lever.

## Circuito (4 Rondas)
- **Hollow Body Hold**: 45 segundos
- **L-Sit Progressions**: 30 segundos
- **Leg Raises**: 15 reps
- **Plank**: 60 segundos

## Tips de Oro
**Mantén la retroversión pélvica** en todo momento. Si tu espalda baja se arquea, detente y descansa.
        `
    }
];
