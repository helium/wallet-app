import ExpoModulesCore
import UIKit

public class ScrollEdgeEffectModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScrollEdgeEffect")

    View(HiddenBottomEdgeEffectView.self) {}
  }
}

// Hides UIKit's bottom scroll edge effect on the first scroll view inside this
// view. UIKit fixes the effect's frame in the scroll view's own coordinates, so
// it does not follow a parent that moves by transform, like a bottom sheet.
class HiddenBottomEdgeEffectView: ExpoView {
  private weak var scrollView: UIScrollView?

  override func didAddSubview(_ subview: UIView) {
    super.didAddSubview(subview)
    hideEdgeEffect()
  }

  // The scroll view can mount after its parent does.
  override func layoutSubviews() {
    super.layoutSubviews()
    hideEdgeEffect()
  }

  // React Native reuses scroll views, so the next one to use this scroll view
  // gets the effect back.
  override func willRemoveSubview(_ subview: UIView) {
    super.willRemoveSubview(subview)
    guard let scrollView, scrollView.isDescendant(of: subview) else { return }
    setEdgeEffectHidden(scrollView, false)
    self.scrollView = nil
  }

  private func hideEdgeEffect() {
    guard scrollView == nil, let found = firstScrollView() else { return }
    scrollView = found
    setEdgeEffectHidden(found, true)
  }

  private func firstScrollView() -> UIScrollView? {
    var queue = subviews
    while !queue.isEmpty {
      let view = queue.removeFirst()
      if let scrollView = view as? UIScrollView { return scrollView }
      queue.append(contentsOf: view.subviews)
    }
    return nil
  }

  // iOS 26 added the edge effect. Before that there is nothing to hide.
  private func setEdgeEffectHidden(_ scrollView: UIScrollView, _ hidden: Bool) {
    if #available(iOS 26.0, *) {
      scrollView.bottomEdgeEffect.isHidden = hidden
    }
  }
}
