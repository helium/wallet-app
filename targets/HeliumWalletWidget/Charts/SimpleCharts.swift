// Vendored from spacenation/swiftui-charts and spacenation/swiftui-shapes
// to avoid Xcode 16 ExtractAppIntentsMetadata build error with SPM packages.
// License: MIT

import SwiftUI

// MARK: - Shapes Utilities

extension CGPoint {
    init(unitPoint: UnitPoint, in rect: CGRect) {
        self.init(
            x: rect.width * unitPoint.x,
            y: rect.height - (rect.height * unitPoint.y)
        )
    }

    func halfway(to point: CGPoint) -> CGPoint {
        CGPoint(x: (self.x + point.x) * 0.5, y: (self.y + point.y) * 0.5)
    }

    func quadCurveControlPoint(with point: CGPoint) -> CGPoint {
        let halfwayPoint = self.halfway(to: point)
        let absoluteDistance = abs(point.y - halfwayPoint.y)

        if self.y < point.y {
            return CGPoint(x: halfwayPoint.x, y: halfwayPoint.y + absoluteDistance)
        } else if self.y > point.y {
            return CGPoint(x: halfwayPoint.x, y: halfwayPoint.y - absoluteDistance)
        } else {
            return halfwayPoint
        }
    }
}

extension Collection where Element == UnitPoint {
    func points(in rect: CGRect) -> [CGPoint] {
        self.map { CGPoint(unitPoint: $0, in: rect) }
    }
}

extension Path {
    mutating func addQuadCurves(_ points: [CGPoint]) {
        guard points.count > 0 else { return }

        if let currentPoint = self.currentPoint {
            var lastPoint = currentPoint
            (0..<points.count).forEach { index in
                let nextPoint = points[index]
                let halfwayPoint = lastPoint.halfway(to: nextPoint)
                let firstControlPoint = halfwayPoint.quadCurveControlPoint(with: lastPoint)
                self.addQuadCurve(to: halfwayPoint, control: firstControlPoint)
                let secondControlPoint = halfwayPoint.quadCurveControlPoint(with: nextPoint)
                self.addQuadCurve(to: nextPoint, control: secondControlPoint)
                lastPoint = nextPoint
            }
        } else {
            var lastPoint = points[0]
            self.move(to: lastPoint)
            (1..<points.count).forEach { index in
                let nextPoint = points[index]
                let halfwayPoint = lastPoint.halfway(to: nextPoint)
                let firstControlPoint = halfwayPoint.quadCurveControlPoint(with: lastPoint)
                self.addQuadCurve(to: halfwayPoint, control: firstControlPoint)
                let secondControlPoint = halfwayPoint.quadCurveControlPoint(with: nextPoint)
                self.addQuadCurve(to: nextPoint, control: secondControlPoint)
                lastPoint = nextPoint
            }
        }
    }
}

// MARK: - Line Shape

struct Line: Shape {
    private let unitPoints: [UnitPoint]

    func path(in rect: CGRect) -> Path {
        Path { path in
            path.addLines(self.unitPoints.points(in: rect))
        }
    }

    init<Data: RandomAccessCollection>(unitData: Data) where Data.Element: BinaryFloatingPoint {
        let step: CGFloat = unitData.count > 1 ? 1.0 / CGFloat(unitData.count - 1) : 1.0
        self.unitPoints = unitData.enumerated().map { (index, dataPoint) in
            UnitPoint(x: step * CGFloat(index), y: CGFloat(dataPoint))
        }
    }
}

// MARK: - QuadCurve Shape

struct QuadCurve: Shape {
    let unitPoints: [UnitPoint]

    func path(in rect: CGRect) -> Path {
        Path { path in
            path.addQuadCurves(self.unitPoints.points(in: rect))
        }
    }

    init<Data: RandomAccessCollection>(unitData: Data) where Data.Element: BinaryFloatingPoint {
        let step: CGFloat = unitData.count > 1 ? 1.0 / CGFloat(unitData.count - 1) : 1.0
        self.unitPoints = unitData.enumerated().map { (index, dataPoint) in
            UnitPoint(x: step * CGFloat(index), y: CGFloat(dataPoint))
        }
    }
}

// MARK: - Chart Style Protocol

protocol ChartStyle {
    associatedtype Body: View
    func makeBody(configuration: Self.Configuration) -> Self.Body
    typealias Configuration = ChartStyleConfiguration
}

struct ChartStyleConfiguration {
    let dataMatrix: [[CGFloat]]
}

struct AnyChartStyle: ChartStyle {
    private let styleMakeBody: (ChartStyle.Configuration) -> AnyView

    init<S: ChartStyle>(_ style: S) {
        self.styleMakeBody = style.makeTypeErasedBody
    }

    func makeBody(configuration: ChartStyle.Configuration) -> AnyView {
        self.styleMakeBody(configuration)
    }
}

private extension ChartStyle {
    func makeTypeErasedBody(configuration: ChartStyle.Configuration) -> AnyView {
        AnyView(makeBody(configuration: configuration))
    }
}

struct ChartStyleKey: EnvironmentKey {
    static let defaultValue: AnyChartStyle = AnyChartStyle(LineChartStyle())
}

extension EnvironmentValues {
    var chartStyle: AnyChartStyle {
        get { self[ChartStyleKey.self] }
        set { self[ChartStyleKey.self] = newValue }
    }
}

extension View {
    func chartStyle<S>(_ style: S) -> some View where S: ChartStyle {
        self.environment(\.chartStyle, AnyChartStyle(style))
    }
}

// MARK: - Chart View

struct Chart: View {
    @Environment(\.chartStyle) private var style
    private var configuration: ChartStyleConfiguration

    var body: some View {
        self.style.makeBody(configuration: self.configuration)
    }

    init(_ configuration: ChartStyleConfiguration) {
        self.configuration = configuration
    }

    init<Data: RandomAccessCollection>(data: Data) where Data.Element: BinaryFloatingPoint {
        self.init(ChartStyleConfiguration(dataMatrix: data.map { [CGFloat($0)] }))
    }
}

// MARK: - LineChartStyle

enum LineType {
    case line
    case quadCurve
}

struct LineChartStyle: ChartStyle {
    private let lineType: LineType
    private let lineColor: Color
    private let lineWidth: CGFloat

    @ViewBuilder
    func makeBody(configuration: Configuration) -> some View {
        switch lineType {
        case .line:
            Line(unitData: configuration.dataMatrix.map { $0.reduce(0, +) })
                .stroke(lineColor, style: .init(lineWidth: lineWidth, lineCap: .round))
        case .quadCurve:
            QuadCurve(unitData: configuration.dataMatrix.map { $0.reduce(0, +) })
                .stroke(lineColor, style: .init(lineWidth: lineWidth, lineCap: .round))
        }
    }

    init(_ lineType: LineType = .quadCurve, lineColor: Color = .accentColor, lineWidth: CGFloat = 1) {
        self.lineType = lineType
        self.lineColor = lineColor
        self.lineWidth = lineWidth
    }
}

// MARK: - AreaChartStyle

private struct AreaChart: Shape {
    private let lineType: LineType
    private let unitPoints: [UnitPoint]

    func path(in rect: CGRect) -> Path {
        Path { path in
            switch self.lineType {
            case .line:
                path.addLines(self.unitPoints.points(in: rect))
            case .quadCurve:
                path.addQuadCurves(self.unitPoints.points(in: rect))
            }

            path.addLine(to: CGPoint(unitPoint: .topTrailing, in: rect))
            path.addLine(to: CGPoint(unitPoint: .topLeading, in: rect))
            path.closeSubpath()
        }
    }

    init<Data: RandomAccessCollection>(unitData: Data, lineType: LineType) where Data.Element: BinaryFloatingPoint {
        self.lineType = lineType
        let step: CGFloat = unitData.count > 1 ? 1.0 / CGFloat(unitData.count - 1) : 1.0
        self.unitPoints = unitData.enumerated().map { (index, dataPoint) in
            UnitPoint(x: step * CGFloat(index), y: CGFloat(dataPoint))
        }
    }
}

struct AreaChartStyle<Fill: View>: ChartStyle {
    private let lineType: LineType
    private let fill: Fill

    func makeBody(configuration: Self.Configuration) -> some View {
        fill
            .clipShape(
                AreaChart(unitData: configuration.dataMatrix.map { $0.reduce(0, +) }, lineType: self.lineType)
            )
    }

    init(_ lineType: LineType = .quadCurve, fill: Fill) {
        self.lineType = lineType
        self.fill = fill
    }
}
